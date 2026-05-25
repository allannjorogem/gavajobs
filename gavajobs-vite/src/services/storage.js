import { supabase } from './supabase'

// ── Profile ──

export async function getProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.error('[Storage] getProfile:', error); return null }
  return data
}

export async function saveProfile(userId, profile) {
  if (!userId) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .maybeSingle()
  if (error) { console.error('[Storage] saveProfile:', error); throw error }
  return data
}

// ── Saved Jobs ──

export async function getSavedJobs(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('user_id', userId)
  if (error) { console.error('[Storage] getSavedJobs:', error); return [] }
  return (data || []).map(r => r.job_id)
}

export async function saveJob(userId, jobId) {
  if (!userId) return
  const { error } = await supabase
    .from('saved_jobs')
    .insert({ user_id: userId, job_id: jobId })
  if (error && error.code !== '23505') console.error('[Storage] saveJob:', error)
}

export async function unsaveJob(userId, jobId) {
  if (!userId) return
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId)
  if (error) console.error('[Storage] unsaveJob:', error)
}

// ── Clear All (sign out) ──

export async function clearAllData() {
  await supabase.auth.signOut()
}
