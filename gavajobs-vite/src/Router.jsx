import { useState, useEffect } from 'react'
import App from './App'
import Admin from './pages/Admin'
import { supabase } from './services/supabase'

function Router() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (route !== '#/admin') { setChecking(false); return }
    async function checkAdmin() {
      setChecking(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsAdmin(false); setChecking(false); return }
      const { data } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      setIsAdmin(!!data)
      setChecking(false)
    }
    checkAdmin()
  }, [route])

  if (route === '#/admin') {
    if (checking) return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#636B80' }}>
        Checking access…
      </div>
    )
    if (!isAdmin) return (
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' }}>
        <div style={{ fontSize:32, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Access Denied</div>
        <div style={{ fontSize:14, color:'#636B80', marginBottom:24 }}>You must be signed in as an admin to access this page.</div>
        <a href="/" style={{ fontSize:14, color:'#C8102E' }}>← Back to GavaJobs</a>
      </div>
    )
    return <Admin />
  }
  return <App />
}

export default Router
