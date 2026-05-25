// ═══════════════════════════════════════════════════════════
// Edge Function: Initiate M-Pesa Payment
//
// Called by frontend when user taps "Unlock Premium — KES 199/mo"
// Sends STK push to user's phone via payment gateway
//
// GATEWAY AGNOSTIC: Swap the gateway adapter below.
// Supported: IntaSend, Pesapal, Flutterwave, Paystack, Daraja
// ═══════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const gatewayApiKey = Deno.env.get('PAYMENT_GATEWAY_API_KEY')!
const gatewaySecretKey = Deno.env.get('PAYMENT_GATEWAY_SECRET_KEY')!
const gatewayProvider = Deno.env.get('PAYMENT_GATEWAY_PROVIDER') || 'intasend'
const callbackUrl = Deno.env.get('PAYMENT_CALLBACK_URL')!

const AMOUNT = 199 // KES
const CURRENCY = 'KES'
const DESCRIPTION = 'GavaJobs Premium — 1 month'

// ── Gateway Adapters ──
// Each adapter sends an STK push and returns { success, reference, error }

async function intasendPush(phone: string, paymentId: string) {
  const res = await fetch('https://payment.intasend.com/api/v1/payment/mpesa-stk-push/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gatewayApiKey}`,
    },
    body: JSON.stringify({
      amount: AMOUNT,
      phone_number: phone,
      api_ref: paymentId,
      narrative: DESCRIPTION,
    }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, reference: null, error: data.message || 'IntaSend error' }
  return { success: true, reference: data.invoice?.invoice_id || paymentId, error: null }
}

async function pesapalPush(phone: string, paymentId: string) {
  // Step 1: Get auth token
  const authRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: gatewayApiKey, consumer_secret: gatewaySecretKey }),
  })
  const { token } = await authRes.json()
  
  // Step 2: Submit order
  const res = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      id: paymentId,
      currency: CURRENCY,
      amount: AMOUNT,
      description: DESCRIPTION,
      callback_url: callbackUrl,
      billing_address: { phone_number: phone },
    }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, reference: null, error: data.message || 'Pesapal error' }
  return { success: true, reference: data.order_tracking_id || paymentId, error: null }
}

async function flutterwavePush(phone: string, paymentId: string) {
  const res = await fetch('https://api.flutterwave.com/v3/charges?type=mpesa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gatewaySecretKey}` },
    body: JSON.stringify({
      tx_ref: paymentId,
      amount: AMOUNT,
      currency: CURRENCY,
      phone_number: phone,
      email: 'customer@gavajobs.co.ke', // placeholder
    }),
  })
  const data = await res.json()
  if (data.status !== 'success') return { success: false, reference: null, error: data.message || 'Flutterwave error' }
  return { success: true, reference: data.data?.flw_ref || paymentId, error: null }
}

async function paystackPush(phone: string, paymentId: string) {
  const res = await fetch('https://api.paystack.co/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gatewaySecretKey}` },
    body: JSON.stringify({
      amount: AMOUNT * 100, // Paystack uses kobo/cents
      email: 'customer@gavajobs.co.ke',
      currency: CURRENCY,
      mobile_money: { phone, provider: 'mpesa' },
      reference: paymentId,
    }),
  })
  const data = await res.json()
  if (!data.status) return { success: false, reference: null, error: data.message || 'Paystack error' }
  return { success: true, reference: data.data?.reference || paymentId, error: null }
}

// ── Gateway Router ──
const gateways: Record<string, (phone: string, id: string) => Promise<any>> = {
  intasend: intasendPush,
  pesapal: pesapalPush,
  flutterwave: flutterwavePush,
  paystack: paystackPush,
}

// ── Main Handler ──
Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: { user }, error: authError } = await createClient(supabaseUrl, authHeader.replace('Bearer ', ''), {
      auth: { autoRefreshToken: false, persistSession: false }
    }).auth.getUser()

    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })

    // Parse request
    const { phone } = await req.json()
    if (!phone || !/^254\d{9}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number. Use format 254XXXXXXXXX' }), { status: 400 })
    }

    // Create payment record
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({ user_id: user.id, amount: AMOUNT, phone, status: 'pending' })
      .select()
      .single()

    if (insertError) throw insertError

    // Send STK push via selected gateway
    const push = gateways[gatewayProvider]
    if (!push) throw new Error(`Unknown gateway: ${gatewayProvider}`)

    const result = await push(phone, payment.id)

    if (!result.success) {
      // Mark payment as failed
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      return new Response(JSON.stringify({ error: result.error }), { status: 502 })
    }

    // Update with gateway reference
    await supabase.from('payments').update({ mpesa_ref: result.reference }).eq('id', payment.id)

    return new Response(JSON.stringify({
      payment_id: payment.id,
      status: 'pending',
      message: 'Check your phone for the M-Pesa prompt'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('[initiate-payment]', error)
    return new Response(JSON.stringify({ error: 'Payment failed. Please try again.' }), { status: 500 })
  }
})
