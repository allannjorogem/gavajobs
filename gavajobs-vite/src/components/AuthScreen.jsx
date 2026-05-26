import { useState } from 'react'
import { C } from '../constants/theme'
import { supabase } from '../services/supabase'

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleGoogle = async () => {
    setError("")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(error.message)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(""); setMessage("")
    if (!email || !password) { setError("Please fill in all fields"); return }
    if (mode === "register" && password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }

    setLoading(true)
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin }
        })
        if (error) throw error
        setMessage("Check your email for a confirmation link.")
        setLoading(false)
        return
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuth(data.user)
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    }
    setLoading(false)
  }

  const inputStyle = { width:"100%", padding:"12px 14px", fontSize:15, fontFamily:"inherit", border:`1.5px solid ${C.border}`, borderRadius:10, outline:"none", color:C.text, background:C.white }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ height:4, background:`linear-gradient(90deg,${C.black} 33%,${C.red} 33% 66%,${C.green} 66%)` }}/>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:36, fontWeight:800, marginBottom:6 }}>
              <span style={{ color:C.black }}>Gava</span><span style={{ color:C.red }}>Jobs</span>
              <span style={{ width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block", marginLeft:3, verticalAlign:"baseline" }}/>
            </div>
            <div style={{ fontSize:14, color:C.text2 }}>Kenya's government job matching portal</div>
          </div>

          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:"28px 24px", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", gap:0, marginBottom:24, background:C.bg, borderRadius:10, padding:3 }}>
              {["login","register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMessage("") }}
                  style={{ flex:1, padding:"10px 0", fontSize:14, fontWeight:600, fontFamily:"inherit", border:"none", borderRadius:8, cursor:"pointer",
                    background:mode===m?C.white:"transparent", color:mode===m?C.text:C.text3,
                    boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Google OAuth button */}
            <button onClick={handleGoogle}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                padding:"11px 0", fontSize:14, fontWeight:600, fontFamily:"inherit",
                border:`1.5px solid ${C.border}`, borderRadius:10, cursor:"pointer",
                background:C.white, color:C.text, marginBottom:16, transition:"background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background=C.bg}
              onMouseLeave={e => e.currentTarget.style.background=C.white}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:C.border }}/>
              <span style={{ fontSize:12, color:C.text3, fontWeight:500 }}>or use email</span>
              <div style={{ flex:1, height:1, background:C.border }}/>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text2, marginBottom:5 }}>Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="John Kamau" style={inputStyle}/>
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text2, marginBottom:5 }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text2, marginBottom:5 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle}/>
              </div>
              {mode === "register" && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text2, marginBottom:5 }}>Confirm Password</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Type password again" style={inputStyle}/>
                </div>
              )}

              {error && (
                <div style={{ padding:"10px 12px", background:C.redSoft, border:`1px solid #FECACA`, borderRadius:8, fontSize:13, color:"#991B1B", marginBottom:14 }}>
                  {error}
                </div>
              )}
              {message && (
                <div style={{ padding:"10px 12px", background:"#F0FDF4", border:`1px solid #86EFAC`, borderRadius:8, fontSize:13, color:"#166534", marginBottom:14 }}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"13px 0", fontSize:15, fontWeight:700, fontFamily:"inherit", border:"none", borderRadius:10, cursor:loading?"wait":"pointer",
                  background:loading?C.text3:C.red, color:C.white, marginTop:4 }}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>

          <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:C.text3, lineHeight:1.6 }}>
            By continuing you agree to GavaJobs Terms of Service.<br/>
            GavaJobs is not an official Government of Kenya website.
          </div>
        </div>
      </div>
    </div>
  )
}
