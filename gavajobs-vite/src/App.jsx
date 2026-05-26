import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import ScoreRing from './components/ScoreRing'
import { JobCard } from './components/ProfileBuilder'
import { C } from './constants/theme'
import { EDU_LEVELS, EDU_RANK } from './constants/education'
import { SECTORS } from './constants/sectors'
import { FIELD_PILLS } from './constants/fieldPills'
import { PROF_QUALS } from './constants/profQuals'
import { PROF_BODIES } from './constants/profBodies'
import { computeMatch, isManagement, jobSeniority } from './services/matchingEngine'
import { matchColor, matchLabel, dl, ini } from './utils/helpers'
import { useStore } from './hooks/useStore'
import ProfileBuilder from './components/ProfileBuilder'
import Detail from './components/Detail'
import AuthScreen from './components/AuthScreen'
import { supabase } from './services/supabase'

export default function App() {
  const [auth, setAuth] = useStore("gava_auth", null)
  const [saved, setSaved] = useStore("gava_saved", [])
  const [followedEmps, setFollowedEmps] = useStore("gava_followed_employers", [])
  const [premium, setPremium] = useStore("gava_premium", false)
  const [profile, setProfile] = useStore("gava_profile", null)
  const [sector, setSector] = useState("All")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState(null)
  const [mobOpen, setMobOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(12)
  const listRef = useRef(null)
  const [showClosed, setShowClosed] = useState(false)
  const [showMgmt, setShowMgmt] = useState(false)
  const [sortBy, setSortBy] = useState("match")
  const [showProfileBuilder, setShowProfileBuilder] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [guest, setGuest] = useStore("gava_guest", false)

  // ── AUTH SESSION LISTENER ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setAuth(session.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── JOBS FROM SUPABASE ──
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'published')
          .order('added_date', { ascending: false })
        if (error) throw error
        // Map Supabase snake_case columns to camelCase expected by the app
        const mapped = (data || []).map(j => ({
          id: j.display_id,
          src: j.source,
          isNew: j.is_new,
          open: j.status === 'published',
          deadline: j.deadline,
          addedDate: j.added_date,
          title: j.title,
          employer: j.employer,
          sector: j.sector,
          county: j.county,
          edu: j.edu_min,
          posts: j.posts,
          grade: j.grade,
          ref: j.ref,
          flag: j.flag,
          about: j.about,
          responsibilities: j.responsibilities || [],
          requirements: j.requirements || [],
          howToApply: j.how_to_apply,
          chapterSix: j.chapter_six,
          ai_summary: j.ai_summary,
          ai_match_fields: j.ai_match_fields,
        }))
        setJobs(mapped)
      } catch (err) {
        console.error('[GavaJobs] Failed to fetch jobs:', err)
        setJobs([])
      } finally {
        setJobsLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const toggleSave = useCallback(id => setSaved(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]), [])
  const toggleFollow = useCallback(emp => setFollowedEmps(p => p.includes(emp) ? p.filter(x=>x!==emp) : [...p, emp]), [])
  const select = useCallback(job => { setSelected(job); setMobOpen(true) }, [])

  // ── MATCH CACHE ──
  const [matchCache, setMatchCache] = useState({})
  useEffect(() => {
    if (!profile || jobs.length === 0) { setMatchCache({}); return }
    const raf = requestAnimationFrame(() => {
      const cache = {}
      jobs.forEach(j => {
        if (j.ai_match_fields) {
          cache[j.id] = computeMatch(profile, j.ai_match_fields)
        }
      })
      setMatchCache(cache)
    })
    return () => cancelAnimationFrame(raf)
  }, [profile, jobs])

  const getMatch = useCallback((jobId) => matchCache[jobId] || null, [matchCache])

  // ── SEARCH INDEX ──
  const [searchIndex, setSearchIndex] = useState([])
  useEffect(() => {
    if (jobs.length === 0) return
    const raf = requestAnimationFrame(() => {
      setSearchIndex(jobs.map(j => ({
        id: j.id,
        text: [j.title, j.employer, j.about||"", j.ai_summary||"", j.county||""].join(" ").toLowerCase(),
        deadlineTs: new Date(j.deadline||"2099-12-31").getTime(),
      })))
    })
    return () => cancelAnimationFrame(raf)
  }, [jobs])

  const filtered = useMemo(() => {
    let base = showSaved ? jobs.filter(j => saved.includes(j.id)) : jobs
    const ql = q ? q.toLowerCase() : ""
    let f = base.filter(j => {
      if (sector !== "All" && j.sector !== sector) return false
      if (ql) {
        if (searchIndex.length > 0) {
          const idx = searchIndex.find(s => s.id === j.id)
          if (!idx || !idx.text.includes(ql)) return false
        } else {
          const fallback = (j.title + " " + j.employer).toLowerCase()
          if (!fallback.includes(ql)) return false
        }
      }
      if (showMgmt && !isManagement(j.title)) return false
      return true
    })
    if (sortBy==="match" && profile) {
      const fe = new Set(followedEmps)
      f.sort((a,b) => {
        const matchA = getMatch(a.id)
        const matchB = getMatch(b.id)
        const sa = matchA?.score || 0
        const sb = matchB?.score || 0
        if (sb !== sa) return sb - sa
        const fA = fe.has(a.employer) ? 1 : 0
        const fB = fe.has(b.employer) ? 1 : 0
        if (fB !== fA) return fB - fA
        const senA = jobSeniority(a)
        const senB = jobSeniority(b)
        if (senB !== senA) return senB - senA
        const expA = a.ai_match_fields?.years_experience || 0
        const expB = b.ai_match_fields?.years_experience || 0
        if (expB !== expA) return expB - expA
        const metA = matchA?.metCount || 0
        const metB = matchB?.metCount || 0
        if (metB !== metA) return metB - metA
        return 0
      })
    } else if (sortBy==="deadline") {
      const tsMap = {}
      searchIndex.forEach(s => tsMap[s.id] = s.deadlineTs)
      f.sort((a,b) => (tsMap[a.id]||0) - (tsMap[b.id]||0))
    } else {
      const tsMap = {}
      searchIndex.forEach(s => tsMap[s.id] = s.deadlineTs)
      f.sort((a,b) => (tsMap[b.id]||0) - (tsMap[a.id]||0))
    }
    return f
  }, [sector, q, showClosed, showMgmt, sortBy, profile, showSaved, saved, getMatch, searchIndex, jobs])

  const isJobOpen = useCallback(j => {
    if (!j.open) return false
    const deadline = new Date(j.deadline + "T17:00:00+03:00")
    return deadline >= new Date()
  }, [])

  const openJobs = useMemo(() => filtered.filter(j => isJobOpen(j)), [filtered, isJobOpen])
  const closedJobs = useMemo(() => filtered.filter(j => !isJobOpen(j)), [filtered, isJobOpen])
  
  const [showLowMatches, setShowLowMatches] = useState(false)
  const relevantJobs = useMemo(() => {
    if (!profile) return openJobs
    return openJobs.filter(j => {
      const m = getMatch(j.id)
      if (!m) return true
      return m.score > 15
    })
  }, [openJobs, profile, getMatch])
  const lowMatchJobs = useMemo(() => {
    if (!profile) return []
    return openJobs.filter(j => {
      const m = getMatch(j.id)
      return m && m.score <= 15
    })
  }, [openJobs, profile, getMatch])
  useEffect(() => { setVisibleCount(12) }, [sector, q, sortBy, showSaved, showMgmt])

  const [showAuth, setShowAuth] = useState(false)

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:C.bg, fontFamily:'"Outfit",-apple-system,BlinkMacSystemFont,sans-serif', overflow:"hidden" }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap");
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root,[data-reactroot]{height:100%!important}
        body{background:${C.bg};color:${C.text};font-family:"Outfit",-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        .job-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.06)!important}
        @media(min-width:1024px){.detail-col{display:flex!important;flex-direction:column}.mob-sheet{display:none!important}.list-col{width:420px!important;max-width:420px!important}}
        @media(max-width:1023px){.detail-col{display:none!important}.mob-sheet{display:block!important}.list-col{width:100%!important;max-width:100%!important;border-right:none!important}.mob-back{display:flex!important}}
        @media(max-width:600px){.stat-bar{display:none!important}.desk-only{display:none!important}}
      `}</style>

      {/* HEADER */}
      <header style={{ background:C.white, borderBottom:`1px solid ${C.border}`, flexShrink:0, zIndex:50 }}>
        <div style={{ height:4, background:`linear-gradient(90deg,${C.black} 33%,${C.red} 33% 66%,${C.green} 66%)` }}/>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", maxWidth:1400, margin:"0 auto", width:"100%" }}>
          <div onClick={() => { setShowSaved(false); setSelected(null) }} style={{ fontWeight:700, fontSize:20, flexShrink:0, cursor:"pointer" }}>
            <span style={{ color:C.black }}>Gava</span><span style={{ color:C.red }}>Jobs</span>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, display:"inline-block", marginLeft:2, verticalAlign:"baseline", position:"relative", top:"0px" }}/>
          </div>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.borderLight, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"0 12px", minWidth:0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color:C.text3, flexShrink:0 }}><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search jobs, agencies…" style={{ flex:1, border:"none", background:"transparent", outline:"none", fontFamily:"inherit", fontSize:14, color:C.text, padding:"9px 0", minWidth:0 }}/>
            {q && <button onClick={()=>setQ("")} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3 }}>✕</button>}
          </div>
          
          <button onClick={() => auth ? setShowProfileBuilder(true) : setShowAuth(true)} style={{ display:"flex", alignItems:"center", gap:4, background:profile?C.greenSoft:C.redSoft, border:`1.5px solid ${profile?C.green:C.red}`, borderRadius:8, padding:"7px 10px", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, color:profile?C.green:C.red, flexShrink:0, whiteSpace:"nowrap" }}>
            {profile ? "✓ Profile" : "Profile"}
          </button>
          
          <button onClick={() => setShowSaved(p=>!p)} style={{ display:"flex", alignItems:"center", gap:4, position:"relative", background:showSaved?C.redSoft:"none", border:showSaved?`1.5px solid ${C.red}`:`1.5px solid ${C.border}`, borderRadius:8, padding:"7px 8px", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:500, color:showSaved?C.red:C.text2, flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill={showSaved?"currentColor":"none"}><path d="M8 12L3 15V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12l-5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
            <span className="desk-only">Saved</span>
            {saved.length > 0 && <span style={{ background:C.red, color:C.white, fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:10 }}>{saved.length}</span>}
          </button>

          {profile && (
            <button onClick={() => setPremium(p => !p)} style={{ display:"flex", alignItems:"center", gap:3, background:premium?"#FEF3C7":"none", border:`1px solid ${premium?"#F59E0B":C.border}`, borderRadius:8, padding:"7px 8px", cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:600, color:premium?"#92400E":C.text3, flexShrink:0 }}>
              {premium ? "★ Pro" : "☆ Go Pro"}
            </button>
          )}

          {auth ? (
            <button onClick={() => {
                setProfile(null); setSaved([]); setFollowedEmps([]); setPremium(false); setSelected(null); setShowSaved(false); setAuth(null); setGuest(false)
                try { localStorage.removeItem("gava_profile"); localStorage.removeItem("gava_saved"); localStorage.removeItem("gava_followed_employers"); localStorage.removeItem("gava_premium"); localStorage.removeItem("gava_auth"); localStorage.removeItem("gava_guest") } catch {}
            }} style={{ display:"flex", alignItems:"center", gap:3, background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 8px", cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:500, color:C.text3, flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10.5 12.5L14 8l-3.5-4.5M14 8H6"/></svg>
              <span className="desk-only">Sign out</span>
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)}
              style={{ display:"flex", alignItems:"center", gap:4, background:C.red, border:"none", borderRadius:8, padding:"7px 12px", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, color:C.white, flexShrink:0 }}>
              Sign In
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 16px 8px", maxWidth:1400, margin:"0 auto", width:"100%", borderTop:`1px solid ${C.borderLight}` }}>
          <div style={{ display:"flex", gap:4, overflowX:"auto", flex:1, scrollbarWidth:"none" }}>
            {SECTORS.map(s => (
              <button key={s} onClick={() => setSector(s)} style={{ whiteSpace:"nowrap", fontSize:12, fontWeight:500, padding:"5px 12px", borderRadius:20, background:sector===s?C.black:C.white, color:sector===s?C.white:C.text2, border:`1px solid ${sector===s?C.black:C.border}`, cursor:"pointer", fontFamily:"inherit" }}>{s}</button>
            ))}
            <button onClick={() => setShowMgmt(p=>!p)} style={{ whiteSpace:"nowrap", fontSize:12, fontWeight:500, padding:"5px 12px", borderRadius:20, background:showMgmt?"#6D28D9":C.white, color:showMgmt?C.white:"#6D28D9", border:`1px solid ${showMgmt?"#6D28D9":"#C4B5FD"}`, cursor:"pointer", fontFamily:"inherit" }}>Management</button>
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ fontFamily:"inherit", fontSize:11, padding:"5px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:C.white, color:C.text2, cursor:"pointer" }}>
            <option value="match">{profile?"Best match":"Newest first"}</option>
            <option value="deadline">Closing soon</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </header>

      {/* TWO-PANEL BODY */}
      <div style={{ flex:1, display:"flex", maxWidth:1400, margin:"0 auto", width:"100%", minHeight:0, overflow:"hidden" }}>
        <div className="list-col" ref={listRef} onScroll={e => {
          const el = e.target
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 200 && visibleCount < filtered.length) {
            setVisibleCount(v => Math.min(v + 15, filtered.length))
          }
        }} style={{ width:420, flexShrink:0, overflowY:"auto", borderRight:`1px solid ${C.border}`, padding:"12px 12px 80px", scrollbarWidth:"thin" }}>
          
          {jobsLoading && (
            <div style={{ textAlign:"center", padding:"40px 16px", color:C.text3, fontSize:13 }}>
              Loading jobs…
            </div>
          )}

          {!profile && !jobsLoading && (
            <div onClick={() => setShowProfileBuilder(true)} style={{ display:"flex", alignItems:"center", gap:10, background:C.white, border:`1.5px dashed ${C.red}`, borderRadius:10, padding:"12px 14px", marginBottom:14, cursor:"pointer" }}>
              <ScoreRing score={0} size={36} locked={true}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Build your profile to unlock matching jobs</div>
                <div style={{ fontSize:11, color:C.text3 }}>2 minutes · See which jobs fit you best</div>
              </div>
              <span style={{ fontSize:12, fontWeight:600, color:C.red }}>Start →</span>
            </div>
          )}
          
          {!jobsLoading && relevantJobs.length > 0 && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, padding:"0 2px" }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.text2, textTransform:"uppercase", letterSpacing:".05em" }}>{showSaved?"Saved":"Active jobs"}</span>
                <span style={{ fontSize:10, fontWeight:600, color:C.white, background:C.green, padding:"2px 8px", borderRadius:10 }}>{relevantJobs.length}</span>
              </div>
              {!showSaved && <p style={{ fontSize:11, color:C.text3, marginBottom:10, padding:"0 2px" }}>Tap any job to view details and your match score</p>}
              {relevantJobs.slice(0, visibleCount).map(j => <JobCard key={j.id} job={j} active={selected?.id===j.id} saved={saved} onSave={toggleSave} onSelect={select} match={getMatch(j.id)} followed={!!profile && followedEmps.includes(j.employer)}/>)}
            </>
          )}
          
          {!jobsLoading && !showSaved && lowMatchJobs.length > 0 && (
            <button onClick={() => setShowLowMatches(p=>!p)} style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, width:"100%", background:"none", border:`1.5px dashed ${C.border}`, color:C.text3, fontSize:11, padding:9, borderRadius:8, cursor:"pointer", margin:"8px 0", fontFamily:"inherit" }}>
              <span>{showLowMatches ? "▲ Hide low matches" : "▼ Jobs outside your field"}</span>
              <span style={{ fontSize:10, fontWeight:600, background:C.borderLight, padding:"1px 6px", borderRadius:8 }}>{lowMatchJobs.length}</span>
            </button>
          )}
          {showLowMatches && lowMatchJobs.map(j => <JobCard key={j.id} job={j} active={selected?.id===j.id} saved={saved} onSave={toggleSave} onSelect={select} match={getMatch(j.id)} followed={!!profile && followedEmps.includes(j.employer)}/>)}
          
          {!jobsLoading && !showSaved && (
            <button onClick={() => setShowClosed(p=>!p)} style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, width:"100%", background:"none", border:`1.5px dashed ${C.border}`, color:C.text3, fontSize:11, padding:9, borderRadius:8, cursor:"pointer", margin:"8px 0", fontFamily:"inherit" }}>
              <span>{showClosed ? "▲ Hide closed" : "▼ Closed jobs"}</span>
              <span style={{ fontSize:10, fontWeight:600, background:C.borderLight, padding:"1px 6px", borderRadius:8 }}>{closedJobs.length}</span>
            </button>
          )}
          {showClosed && closedJobs.map(j => <JobCard key={j.id} job={j} active={selected?.id===j.id} saved={saved} onSave={toggleSave} onSelect={select} match={getMatch(j.id)} followed={!!profile && followedEmps.includes(j.employer)}/>)}
          
          {!jobsLoading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 16px" }}>
              <div style={{ fontSize:32, opacity:.4, marginBottom:10 }}>🔍</div>
              <p style={{ fontWeight:600, color:C.text }}>No jobs found</p>
              <button onClick={() => { setSector("All"); setQ("") }} style={{ marginTop:8, fontFamily:"inherit", fontSize:12, padding:"7px 16px", borderRadius:8, background:"transparent", color:C.red, border:`1.5px solid ${C.red}`, cursor:"pointer" }}>Clear filters</button>
            </div>
          )}
          <div style={{ padding:"24px 8px 12px", textAlign:"center", fontSize:11, color:C.text3, lineHeight:1.5 }}>
            GavaJobs is not an official website of the Government of Kenya.
          </div>
        </div>

        <div className="detail-col" style={{ flex:1, minWidth:0, padding:"0 28px", display:"none" }}>
          <Detail job={selected} saved={saved} onSave={toggleSave} onClose={() => setSelected(null)} profile={profile} onBuildProfile={() => setShowProfileBuilder(true)} getMatch={getMatch} onSelect={select} followedEmps={followedEmps} onToggleFollow={toggleFollow} premium={premium} onUnlockPremium={() => setPremium(true)}/>
        </div>
      </div>

      {mobOpen && selected && (
        <div onClick={() => setMobOpen(false)} className="mob-sheet" style={{ display:"none", position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.45)" }}>
          <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", bottom:0, left:0, right:0, height:"92vh", borderRadius:"18px 18px 0 0", background:C.white, padding:"18px 16px 0", overflowY:"auto", animation:"slideUp .25s ease" }}>
            <Detail job={selected} saved={saved} onSave={toggleSave} onClose={() => setMobOpen(false)} profile={profile} onBuildProfile={() => setShowProfileBuilder(true)} getMatch={getMatch} onSelect={select} followedEmps={followedEmps} onToggleFollow={toggleFollow} premium={premium} onUnlockPremium={() => setPremium(true)}/>
          </div>
        </div>
      )}
      
      {showProfileBuilder && (
        <ProfileBuilder profile={profile} setProfile={setProfile} onClose={() => setShowProfileBuilder(false)}/>
      )}

      {showAuth && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuth(false) }}>
          <div style={{ position:"relative", maxHeight:"90vh", overflowY:"auto", borderRadius:16 }}>
            <button onClick={() => setShowAuth(false)} style={{ position:"absolute", top:12, right:12, zIndex:10, background:C.white, border:`1px solid ${C.border}`, borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:C.text3 }}>✕</button>
            <AuthScreen onAuth={(user) => {
              if (user) { setAuth(user) }
              setShowAuth(false)
              if (user) { setShowProfileBuilder(true) }
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
