import { useState, useEffect } from 'react'

// Persistent state hook — syncs to localStorage
// TODO (Supabase): Replace localStorage with Supabase client calls
// e.g. useStore("gava_profile", null) → useSupabaseState("profiles", userId)
export function useStore(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }, [val, key])
  return [val, setVal]
}
