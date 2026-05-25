// ═══════════════════════════════════════════════════════════
// Supabase Client
//
// SECURITY RULES:
// 1. Only VITE_SUPABASE_ANON_KEY is used here (public key)
// 2. SUPABASE_SERVICE_ROLE_KEY must NEVER be in this file
// 3. Service role key is only used in Edge Functions (server-side)
// 4. All data access is controlled by RLS policies in the database
// 5. The frontend CANNOT bypass RLS — even if someone modifies this code
// ═══════════════════════════════════════════════════════════

// import { createClient } from '@supabase/supabase-js'
//
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
//
// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('[Supabase] Missing environment variables. Check .env file.')
// }
//
// // SECURITY: Never pass service_role key here. Only anon key.
// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true
//   }
// })

// Placeholder until Supabase is connected
export const supabase = null
