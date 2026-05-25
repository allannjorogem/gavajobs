// ═══════════════════════════════════════════════════════════
// Storage Service — async abstraction layer
//
// Currently: localStorage (development)
// Production: Replace with Supabase queries
//
// Every function is async and handles errors.
// Never silently swallow failures.
// ═══════════════════════════════════════════════════════════

// ── Error wrapper ──
async function safeGet(key, fallback) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch (error) {
    console.error(`[Storage] Failed to read ${key}:`, error)
    return fallback
  }
}

async function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return value
  } catch (error) {
    console.error(`[Storage] Failed to write ${key}:`, error)
    throw new Error(`Failed to save ${key}`)
  }
}

// ── Profile ──
// Supabase: supabase.from('profiles').select().eq('user_id', auth.uid()).single()
export async function getProfile() {
  return safeGet('gava_profile', null)
}

// Supabase: supabase.from('profiles').upsert({ user_id: auth.uid(), ...profile })
export async function saveProfile(profile) {
  return safeSet('gava_profile', profile)
}

// ── Auth ──
// Supabase: supabase.auth.getSession()
export async function getAuth() {
  return safeGet('gava_auth', null)
}

// Supabase: handled by supabase.auth.signIn/signUp/signOut
export async function saveAuth(auth) {
  if (auth) {
    return safeSet('gava_auth', auth)
  } else {
    try { localStorage.removeItem('gava_auth') } catch {}
    return null
  }
}

// ── Saved Jobs ──
// Supabase: supabase.from('saved_jobs').select('job_id').eq('user_id', auth.uid())
export async function getSavedJobs() {
  return safeGet('gava_saved', [])
}

// Supabase: supabase.from('saved_jobs').insert/delete
export async function saveSavedJobs(saved) {
  return safeSet('gava_saved', saved)
}

// ── Followed Employers ──
// Supabase: could be a column on profiles or a separate table
export async function getFollowedEmployers() {
  return safeGet('gava_followed_employers', [])
}

export async function saveFollowedEmployers(employers) {
  return safeSet('gava_followed_employers', employers)
}

// ── Premium Status ──
// Supabase: read from profiles.premium — controlled by server, not client
export async function getPremiumStatus() {
  return safeGet('gava_premium', false)
}

export async function savePremiumStatus(premium) {
  return safeSet('gava_premium', premium)
}

// ── Guest Mode ──
export async function getGuestMode() {
  return safeGet('gava_guest', false)
}

export async function saveGuestMode(guest) {
  if (guest) {
    return safeSet('gava_guest', guest)
  } else {
    try { localStorage.removeItem('gava_guest') } catch {}
    return false
  }
}

// ── Clear All (sign out) ──
export async function clearAllData() {
  const keys = ['gava_profile', 'gava_auth', 'gava_saved',
                'gava_followed_employers', 'gava_premium', 'gava_guest']
  keys.forEach(k => {
    try { localStorage.removeItem(k) } catch {}
  })
}
