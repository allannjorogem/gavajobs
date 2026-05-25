// ═══════════════════════════════════════════════════════════
// Edge Function: Payment Callback
//
// Called by the payment gateway when M-Pesa transaction completes.
// Verifies the callback, updates payment status, activates premium.
//
// SECURITY:
// - This endpoint has NO user auth (called by gateway, not browser)
// - Must verify gateway signature to prevent forged callbacks
// - Uses service role key to update database (bypasses RLS)
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const gatewaySecretKey = Deno.env.get('PAYMENT_GATEWAY_SECRET_KEY')!
const gatewayProvider = Deno.env.get('PAYMENT_GATEWAY_PROVIDER') || 'intasend'

const PREMIUM_DAYS = 30

// ── Signature Verification ──
// Each gateway signs callbacks differently. Verify before processing.

function verifyIntasend(body: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = hmac('sha256', gatewaySecretKey, body, 'utf8', 'hex')
  return signature === expected
}

function verifyPesapal(body: string, signature: string | null): boolean {
  // Pesapal uses IPN notification — verify by calling their status API
  // For now, accept and verify the transaction ID against their API
  return true // TODO: Add Pesapal IPN verification
}

function verifyFlutterwave(body: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = hmac('sha256', gatewaySecretKey, body, 'utf8', 'hex')
  return signature === expected
}

function verifyPaystack(body: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = hmac('sha256', gatewaySecretKey, body, 'utf8', 'hex')
  return signature === expected
}

const verifiers: Record<string, (body: string, sig: string | null) => boolean> = {
  intasend: verifyIntasend,
  pesapal: verifyPesapal,
  flutterwave: verifyFlutterwave,
  paystack: verifyPaystack,
}

// ── Extract Payment ID from Callback ──
// Each gateway formats the callback differently

function extractPaymentData(provider: string, data: any) {
  switch (provider) {
    case 'intasend':
      return { paymentId: data.api_ref, mpesaRef: data.mpesa_reference, success: data.state === 'COMPLETE' }
    case 'pesapal':
      return { paymentId: data.merchant_reference, mpesaRef: data.order_tracking_id, success: data.payment_status_description === 'Completed' }
    case 'flutterwave':
      return { paymentId: data.tx_ref || data.data?.tx_ref, mpesaRef: data.flw_ref || data.data?.flw_ref, success: data.status === 'successful' || data.data?.status === 'successful' }
    case 'paystack':
      return { paymentId: data.data?.reference, mpesaRef: data.data?.reference, success: data.event === 'charge.success' }
    default:
      return { paymentId: null, mpesaRef: null, success: false }
  }
}

// ── Main Handler ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const body = await req.text()
    
    // Get signature header (varies by gateway)
    const signature = req.headers.get('X-IntaSend-Signature')
      || req.headers.get('verif-hash')          // Flutterwave
      || req.headers.get('x-paystack-signature') // Paystack
      || req.headers.get('x-pesapal-signature')  // Pesapal

    // Verify signature
    const verify = verifiers[gatewayProvider]
    if (!verify || !verify(body, signature)) {
      console.error('[payment-callback] Invalid signature from', gatewayProvider)
      // Log the attempt
      await supabase.from('payments').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // system
        amount: 0, phone: 'INVALID_CALLBACK', status: 'failed',
      }).catch(() => {}) // best-effort logging
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    // Parse callback data
    const data = JSON.parse(body)
    const { paymentId, mpesaRef, success } = extractPaymentData(gatewayProvider, data)

    if (!paymentId) {
      console.error('[payment-callback] Could not extract payment ID from callback')
      return new Response(JSON.stringify({ error: 'Invalid callback data' }), { status: 400 })
    }

    if (!success) {
      // Payment failed at gateway
      await supabase.from('payments')
        .update({ status: 'failed', mpesa_ref: mpesaRef })
        .eq('id', paymentId)
      console.log('[payment-callback] Payment failed:', paymentId)
      return new Response(JSON.stringify({ status: 'failed' }), { status: 200 })
    }

    // Payment succeeded — update payment record
    const { data: payment, error: updateError } = await supabase.from('payments')
      .update({ status: 'completed', mpesa_ref: mpesaRef, completed_at: new Date().toISOString() })
      .eq('id', paymentId)
      .eq('status', 'pending') // Only update if still pending (idempotent)
      .select()
      .single()

    if (updateError || !payment) {
      console.log('[payment-callback] Payment already processed or not found:', paymentId)
      return new Response(JSON.stringify({ status: 'already_processed' }), { status: 200 })
    }

    // Activate premium for the user
    const premiumExpires = new Date()
    premiumExpires.setDate(premiumExpires.getDate() + PREMIUM_DAYS)

    await supabase.from('profiles')
      .update({ premium: true, premium_expires: premiumExpires.toISOString().split('T')[0] })
      .eq('user_id', payment.user_id)

    console.log('[payment-callback] Premium activated for user:', payment.user_id, 'expires:', premiumExpires)
    return new Response(JSON.stringify({ status: 'completed', premium_expires: premiumExpires }), { status: 200 })

  } catch (error) {
    console.error('[payment-callback] Error:', error)
    return new Response(JSON.stringify({ error: 'Callback processing failed' }), { status: 500 })
  }
})
