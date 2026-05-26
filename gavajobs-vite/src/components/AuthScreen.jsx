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
