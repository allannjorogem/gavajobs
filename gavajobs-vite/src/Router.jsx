import { useState, useEffect } from 'react'
import App from './App'
import Admin from './pages/Admin'

// Simple hash-based router — no dependencies needed
// / → job listing (public)
// /admin → admin panel (auth-protected)
function Router() {
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '#/admin') return <Admin />
  return <App />
}

export default Router
