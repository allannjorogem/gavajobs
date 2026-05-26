import { useState, useMemo } from 'react'
import { C } from '../constants/theme'
import { dl, matchColor } from '../utils/helpers'
import { isManagement } from '../services/matchingEngine'
import { EDU_LEVELS, EDU_RANK, LEADERSHIP_COURSES, SKILLS } from '../constants/education'
import { FIELD_PILLS } from '../constants/fieldPills'
import { PROF_QUALS } from '../constants/profQuals'
import { PROF_BODIES } from '../constants/profBodies'

export default function ProfileBuilder({ profile, setProfile, onClose }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(profile || {
    education: null, study_fields: [], additional_degrees: [],
    prof_quals: [], years_experience: 0, years_management: 0,
    prof_bodies: [], leadership_course: "none", skills: [], county: "Nairobi",
  })
  
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleArr = (k, v) => setForm(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x=>x!==v) : [...(p[k]||[]), v] }))
  
  const STEPS = ["Education","Experience","Qualifications","Skills"]
  const canNext = step===0 ? (form.education && (form.education === "KCSE" || (
    (form.study_fields||[]).length > 0 &&
    (form.education !== "Masters" || (form.study_fields_masters||[]).length > 0) &&
    (form.education !== "PhD" || ((form.study_fields_masters||[]).length > 0 && (form.study_fields_phd||[]).length > 0))
  ))) : step===1 ? true : step===2 ? true : step===3 ? !!(form.email && form.email.includes("@") && form.email.includes(".")) : true
  
  const save = () => { const {_bcom_pending, ...clean} = form; setProfile(clean); onClose() }
  
  const inputStyle = { fontFamily:"inherit", fontSize:14, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.white, color:C.text, width:"100%", outline:"none" }
  const pillStyle = (active) => ({ fontSize:12, fontWeight:500, padding:"7px 14px", borderRadius:20, background:active?C.black:C.white, color:active?C.white:C.text2, border:`1.5px solid ${active?C.black:C.border}`, cursor:"pointer", fontFamily:"inherit", transition:"all .12s" })

  // Fuzzy input: suggests existing presets when user types in "other" fields
  const FuzzyInput = ({ placeholder, presets, alreadySelected, onAdd }) => {
    const [val, setVal] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const check = (v) => {
      setVal(v)
      if (v.length < 2) { setSuggestions([]); return }
      const vl = v.toLowerCase()
      const matches = presets.filter(p => 
        p.toLowerCase().includes(vl) && !(alreadySelected||[]).map(s=>s.toLowerCase()).includes(p.toLowerCase())
      ).slice(0, 4)
      setSuggestions(matches)
    }
    const submit = (v) => {
      if (v.trim()) { onAdd(v.trim()); setVal(""); setSuggestions([]) }
    }
    return (
      <div style={{ position:"relative", flex:1 }}>
        <input
          placeholder={placeholder}
          value={val}
          onChange={e => check(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submit(val) } }}
          style={{...inputStyle, fontSize:12, marginBottom:0}}
        />
        {suggestions.length > 0 && (
          <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:10, background:C.white, border:`1.5px solid ${C.red}`, borderRadius:8, marginTop:2, boxShadow:"0 4px 12px rgba(0,0,0,.1)", overflow:"hidden" }}>
            <div style={{ padding:"6px 10px", fontSize:10, color:C.text3, fontWeight:600, textTransform:"uppercase", borderBottom:`1px solid ${C.borderLight}` }}>Did you mean?</div>
            {suggestions.map(s => (
              <div key={s} onClick={() => { onAdd(s); setVal(""); setSuggestions([]) }} style={{ padding:"8px 10px", fontSize:12, color:C.text, cursor:"pointer", borderBottom:`1px solid ${C.borderLight}` }}
                onMouseOver={e => e.currentTarget.style.background=C.borderLight}
                onMouseOut={e => e.currentTarget.style.background="transparent"}
              >{s}</div>
            ))}
            {val.trim() && !suggestions.map(s=>s.toLowerCase()).includes(val.trim().toLowerCase()) && (
              <div onClick={() => submit(val)} style={{ padding:"8px 10px", fontSize:12, color:C.green, cursor:"pointer", fontWeight:600 }}
                onMouseOver={e => e.currentTarget.style.background=C.borderLight}
                onMouseOut={e => e.currentTarget.style.background="transparent"}
              >Add "{val.trim()}" as new</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:C.white, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:540, maxHeight:"90vh", display:"flex", flexDirection:"column", animation:"slideUp .25s ease" }}>
        {/* Header */}
        <div style={{ padding:"18px 20px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:C.text }}>Profile Builder</h2>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.text3 }}>✕</button>
          </div>
          {/* Progress */}
          <div style={{ display:"flex", gap:4, marginBottom:16 }}>
            {STEPS.map((s,i) => (
              <div key={s} style={{ flex:1, height:4, borderRadius:2, background:i<=step?C.red:C.borderLight, transition:"background .3s" }}/>
            ))}
          </div>
          <p style={{ fontSize:11, color:C.text3, marginBottom:12, textTransform:"uppercase", fontWeight:600, letterSpacing:".04em" }}>{STEPS[step]}</p>
        </div>
        
        {/* Content — scrollable */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 20px 20px", minHeight:0 }}>
          
          {step === 0 && (
            <>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:6 }}>Your highest qualification</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:16 }}>This is matched against the minimum education requirement in each job advert.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
                {EDU_LEVELS.map(e => (
                  <button key={e} onClick={() => set("education", e)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderRadius:10, background:C.white, border:form.education===e?`2px solid ${C.red}`:`1.5px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:500, color:form.education===e?C.red:C.text2 }}>
                    {e}
                    {form.education===e && <span style={{ color:C.red, fontWeight:700 }}>✓</span>}
                  </button>
                ))}
              </div>
              
              {form.education && form.education !== "KCSE" && (<>
              {/* Build the list of field selectors needed based on education level */}
              {(() => {
                const levels = []
                if (form.education === "PhD") levels.push({ key:"study_fields_phd", label:"PhD field(s) of study", hint:"Select the field(s) your doctorate is in." })
                if (form.education === "PhD" || form.education === "Masters") levels.push({ key:"study_fields_masters", label:"Master's degree field(s) of study", hint:"Select the field(s) your master's degree is in." })
                if (["PhD","Masters","Degree"].includes(form.education)) levels.push({ key:"study_fields", label: form.education === "Degree" ? "Bachelor's degree field(s) of study" : "Bachelor's degree field(s) of study", hint: form.education === "Degree" ? "Select the field(s) your bachelor's degree is in." : "Your bachelor's degree may be in a different field — select it here." })
                if (form.education === "Diploma") levels.push({ key:"study_fields", label:"Diploma field(s) of study", hint:"Select the field(s) your diploma is in." })
                if (form.education === "Certificate") levels.push({ key:"study_fields", label:"Certificate field(s) of study", hint:"Select the field(s) your certificate is in." })
                
                return levels.map((lvl, idx) => (
                  <div key={lvl.key} style={{ marginBottom:20, paddingTop:idx>0?16:0, borderTop:idx>0?`1px solid ${C.borderLight}`:"none" }}>
                    <h3 style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:4 }}>{lvl.label}</h3>
                    <p style={{ fontSize:12, color:C.text2, marginBottom:8 }}>{lvl.hint} You can select more than one.</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                      {FIELD_PILLS.map(f => (
                        <button key={f} onClick={() => {
                          const current = form[lvl.key] || []
                          if (current.includes(f)) {
                            set(lvl.key, current.filter(x => x !== f))
                            // Also clear the bcom option if Commerce is deselected
                            if (f === "Commerce") set("_bcom_pending", null)
                          }
                          else if (f === "Commerce") {
                            // Don't add Commerce yet — show option picker
                            set("_bcom_pending", lvl.key)
                          }
                          else set(lvl.key, [...current, f])
                        }} style={{ fontSize:11, fontWeight:500, padding:"5px 10px", borderRadius:16, background:(form[lvl.key]||[]).includes(f)||(f==="Commerce"&&form._bcom_pending===lvl.key)?C.greenSoft:C.white, color:(form[lvl.key]||[]).includes(f)||(f==="Commerce"&&form._bcom_pending===lvl.key)?C.green:C.text3, border:`1px solid ${(form[lvl.key]||[]).includes(f)||(f==="Commerce"&&form._bcom_pending===lvl.key)?C.green:C.border}`, cursor:"pointer", fontFamily:"inherit" }}>
                          {(form[lvl.key]||[]).includes(f) ? "✓ " : (f==="Commerce"&&form._bcom_pending===lvl.key) ? "▼ " : "+ "}{f}
                        </button>
                      ))}
                    </div>
                    {/* BCom option picker */}
                    {form._bcom_pending === lvl.key && (
                      <div style={{ background:C.bg, border:`1.5px solid ${C.red}`, borderRadius:10, padding:12, marginBottom:10 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>What was your BCom option/specialisation?</p>
                        <p style={{ fontSize:11, color:C.text2, marginBottom:8 }}>This matters — a BCom (Accounting) matches differently from a BCom (Marketing).</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {["Accounting","Finance","Marketing","Human Resource Management","Insurance","Banking","Supply Chain Management","General (no option)"].map(opt => (
                            <button key={opt} onClick={() => {
                              const current = form[lvl.key] || []
                              if (opt === "General (no option)") {
                                if (!current.includes("Commerce")) set(lvl.key, [...current, "Commerce"])
                              } else {
                                // Add ONLY the specific option — not Commerce separately
                                // A BCom (Marketing) holder is a marketer, not a finance person
                                let updated = [...current]
                                if (!updated.includes(opt)) updated.push(opt)
                                set(lvl.key, updated)
                              }
                              set("_bcom_pending", null)
                            }} style={{ fontSize:11, fontWeight:500, padding:"6px 12px", borderRadius:16, background:C.white, color:C.text2, border:`1.5px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit" }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:6 }}>
                      <FuzzyInput
                        placeholder="Other field not listed…"
                        presets={FIELD_PILLS}
                        alreadySelected={form[lvl.key]||[]}
                        onAdd={v => { if (!(form[lvl.key]||[]).includes(v)) set(lvl.key,[...(form[lvl.key]||[]),v]) }}
                      />
                    </div>
                    {/* Custom-typed fields shown as removable tags */}
                    {(form[lvl.key]||[]).filter(f => !FIELD_PILLS.includes(f)).length > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                        {(form[lvl.key]||[]).filter(f => !FIELD_PILLS.includes(f)).map(f => (
                          <span key={f} onClick={() => set(lvl.key,(form[lvl.key]||[]).filter(x=>x!==f))} style={{ fontSize:12, padding:"5px 12px", borderRadius:20, background:C.greenSoft, color:C.green, cursor:"pointer", fontWeight:500, border:`1px solid ${C.green}` }}>
                            {f} ✕
                          </span>
                        ))}
                      </div>
                    )}
                    {(form[lvl.key]||[]).length === 0 && (
                      <p style={{ fontSize:12, color:C.red, marginTop:6 }}>Please select at least one field to continue.</p>
                    )}
                  </div>
                ))
              })()}
              </>)}
            </>
          )}
          
          {step === 1 && (
            <>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:6 }}>Total years of experience</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:12 }}>Total relevant work experience across all roles.</p>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                <input type="range" min="0" max="30" value={form.years_experience||0} onChange={e => { const v=parseInt(e.target.value); set("years_experience",v); if((form.years_management||0)>v) set("years_management",v) }} style={{ flex:1, accentColor:C.red, height:6 }} />
                <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                  <button onClick={() => { const v=Math.max(0,(form.years_experience||0)-1); set("years_experience",v); if((form.years_management||0)>v) set("years_management",v) }} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${C.border}`, background:C.white, fontSize:16, cursor:"pointer", fontFamily:"inherit", color:C.text2 }}>−</button>
                  <span style={{ fontSize:20, fontWeight:700, color:C.text, minWidth:36, textAlign:"center" }}>{form.years_experience||0}</span>
                  <button onClick={() => { const v=Math.min(30,(form.years_experience||0)+1); set("years_experience",v) }} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${C.border}`, background:C.white, fontSize:16, cursor:"pointer", fontFamily:"inherit", color:C.text2 }}>+</button>
                  <span style={{ fontSize:12, color:C.text3, marginLeft:2 }}>yrs</span>
                </div>
              </div>
              
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:6 }}>Of which, management/supervisory</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:12 }}>Years spent managing teams or supervising staff.</p>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                <input type="range" min="0" max={Math.max(form.years_experience||0, 0)} value={Math.min(form.years_management||0, form.years_experience||0)} onChange={e => set("years_management", Math.min(parseInt(e.target.value), form.years_experience||0))} style={{ flex:1, accentColor:C.red, height:6 }} />
                <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                  <button onClick={() => set("years_management", Math.max(0,(form.years_management||0)-1))} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${C.border}`, background:C.white, fontSize:16, cursor:"pointer", fontFamily:"inherit", color:C.text2 }}>−</button>
                  <span style={{ fontSize:20, fontWeight:700, color:C.text, minWidth:36, textAlign:"center" }}>{Math.min(form.years_management||0, form.years_experience||0)}</span>
                  <button onClick={() => set("years_management", Math.min((form.years_management||0)+1, form.years_experience||0))} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${C.border}`, background:C.white, fontSize:16, cursor:"pointer", fontFamily:"inherit", color:C.text2 }}>+</button>
                  <span style={{ fontSize:12, color:C.text3, marginLeft:2 }}>yrs</span>
                </div>
              </div>
              
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:6 }}>Preferred county</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:12 }}>We'll highlight jobs near you.</p>
              <select value={form.county||"Nairobi"} onChange={e => set("county", e.target.value)} style={inputStyle}>
                {["Nationwide","Nairobi","Mombasa","Kisumu","Nakuru","Nyeri","Eldoret","Homa Bay","Garissa","Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </>
          )}
          
          {step === 2 && (
            <>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:4 }}>Professional qualifications</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:10 }}>Select the exact qualification(s) you hold.</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                {PROF_QUALS.map(q => (
                  <button key={q.id} onClick={() => toggleArr("prof_quals", q.id)} style={pillStyle((form.prof_quals||[]).includes(q.id))}>
                    {q.label}
                  </button>
                ))}
              </div>
              <FuzzyInput
                placeholder="Other qualification not listed…"
                presets={PROF_QUALS.map(q => q.label)}
                alreadySelected={[...(form.prof_quals||[]).map(q => PROF_QUALS.find(p=>p.id===q)?.label||q), ...(form.other_prof_quals||[])]}
                onAdd={v => {
                  const match = PROF_QUALS.find(p => p.label.toLowerCase() === v.toLowerCase())
                  if (match) { if (!(form.prof_quals||[]).includes(match.id)) toggleArr("prof_quals", match.id) }
                  else { toggleArr("other_prof_quals", v) }
                }}
              />
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:20 }}>
                {(form.other_prof_quals||[]).map(q => (
                  <span key={q} onClick={() => toggleArr("other_prof_quals",q)} style={{ fontSize:11, padding:"4px 10px", borderRadius:16, background:C.greenSoft, color:C.green, cursor:"pointer", border:`1px solid ${C.green}` }}>{q} ✕</span>
                ))}
              </div>
              
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:4 }}>Professional body memberships</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:4 }}>Select bodies you are a current, active member of. Government checks membership status at appointment.</p>
              <p style={{ fontSize:11, color:C.text3, marginBottom:10, fontStyle:"italic" }}>Only select bodies where you hold active membership — not bodies you plan to join.</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                {PROF_BODIES.map(b => (
                  <button key={b.id} onClick={() => toggleArr("prof_bodies", b.id)} style={pillStyle((form.prof_bodies||[]).includes(b.id))}>
                    {b.label}
                  </button>
                ))}
              </div>
              <FuzzyInput
                placeholder="Other body not listed…"
                presets={PROF_BODIES.map(b => b.label)}
                alreadySelected={[...(form.prof_bodies||[]).map(b => PROF_BODIES.find(p=>p.id===b)?.label||b), ...(form.other_prof_bodies||[])]}
                onAdd={v => {
                  const match = PROF_BODIES.find(p => p.label.toLowerCase() === v.toLowerCase())
                  if (match) { if (!(form.prof_bodies||[]).includes(match.id)) toggleArr("prof_bodies", match.id) }
                  else { toggleArr("other_prof_bodies", v) }
                }}
              />
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:20 }}>
                {(form.other_prof_bodies||[]).map(b => (
                  <span key={b} onClick={() => toggleArr("other_prof_bodies",b)} style={{ fontSize:11, padding:"4px 10px", borderRadius:16, background:C.greenSoft, color:C.green, cursor:"pointer", border:`1px solid ${C.green}` }}>{b} ✕</span>
                ))}
              </div>
              
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:6 }}>Leadership/management course</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:4 }}>Senior government roles typically require a course of 4+ weeks.</p>
              <p style={{ fontSize:12, color:C.amber, marginBottom:12, fontStyle:"italic" }}>💡 Government usually means SLDP or SMC from Kenya School of Government — but equivalent courses from other recognised institutions are accepted. Don't give up if you have a different course.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {LEADERSHIP_COURSES.map(c => (
                  <button key={c.id} onClick={() => set("leadership_course", c.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:8, background:C.white, border:form.leadership_course===c.id?`2px solid ${C.red}`:`1.5px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit", fontSize:13, color:form.leadership_course===c.id?C.red:C.text2, textAlign:"left" }}>
                    {c.label}
                    {form.leadership_course===c.id && <span style={{ color:C.red, fontWeight:700 }}>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {step === 3 && (
            <>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:6 }}>Skills</h3>
              <p style={{ fontSize:13, color:C.text2, marginBottom:12 }}>Select skills you have. These boost your match on roles that need them.</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
                {SKILLS.map(s => (
                  <button key={s} onClick={() => toggleArr("skills", s)} style={pillStyle((form.skills||[]).includes(s))}>
                    {s}
                  </button>
                ))}
              </div>
              
              {/* Chapter Six Readiness */}
              <div style={{ marginTop:20, padding:"16px", background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, marginBottom:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:"#92400E", marginBottom:4 }}>Chapter Six Readiness</h3>
                <p style={{ fontSize:12, color:"#92400E", marginBottom:12, lineHeight:1.5 }}>Tick the clearances you already have. You'll need all five when offered a government job. <span style={{ color:"#B45309", fontStyle:"italic" }}>(These are not used in the job matching on this site.)</span></p>
                {[
                  { key:"ch6_kra", label:"KRA Tax Compliance Certificate" },
                  { key:"ch6_helb", label:"HELB Clearance Certificate" },
                  { key:"ch6_eacc", label:"EACC Self-Declaration" },
                  { key:"ch6_dci", label:"DCI Certificate of Good Conduct" },
                  { key:"ch6_crb", label:"CRB Credit Report" },
                ].map(c => (
                  <label key={c.key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:6 }}>
                    <input type="checkbox" checked={!!form[c.key]} onChange={e => set(c.key, e.target.checked)} style={{ accentColor:"#059669" }}/>
                    <span style={{ fontSize:13, color:form[c.key]?"#065F46":"#6B7280" }}>{c.label}</span>
                    {form[c.key] && <span style={{ fontSize:10, color:"#059669", fontWeight:600 }}>✓ Ready</span>}
                  </label>
                ))}
              </div>

              {/* Email — required to save profile and receive alerts */}
              <div style={{ marginTop:24, padding:"18px 16px", background:C.blueSoft, border:`1px solid #BFDBFE`, borderRadius:10 }}>
                <h3 style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:4 }}>Your email address</h3>
                <p style={{ fontSize:13, color:C.text2, marginBottom:12 }}>We'll send you weekly job matches based on your profile. No spam — just jobs that fit you.</p>
                <input
                  type="email"
                  value={form.email||""}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com"
                  style={{...inputStyle, marginBottom:8}}
                />
                <label style={{ display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.alerts_enabled!==false} onChange={e => set("alerts_enabled", e.target.checked)} style={{ marginTop:3, accentColor:C.red }} />
                  <span style={{ fontSize:12, color:C.text2, lineHeight:1.5 }}>Send me weekly email alerts when new government jobs match my profile</span>
                </label>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ display:"flex", gap:8, padding:"14px 20px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          {step > 0 && <button onClick={() => setStep(s=>s-1)} style={{ fontFamily:"inherit", fontSize:14, fontWeight:500, padding:"12px 18px", borderRadius:10, background:"transparent", color:C.text2, border:`1.5px solid ${C.border}`, cursor:"pointer" }}>← Back</button>}
          <button
            onClick={() => step < STEPS.length-1 ? setStep(s=>s+1) : save()}
            disabled={!canNext}
            style={{ flex:1, fontFamily:"inherit", fontSize:14, fontWeight:600, padding:12, borderRadius:10, background:canNext?C.red:C.border, color:canNext?C.white:C.text3, border:"none", cursor:canNext?"pointer":"not-allowed" }}
          >{step === STEPS.length-1 ? "Save profile & start matching" : "Continue"}</button>
        </div>
      </div>
    </div>
  )
}

// ─── JOB CARD ────────────────────────────────────────────────
export const JobCard = React.memo(function JobCard({ job, active, saved, onSave, onSelect, match, followed }) {
  const d = dl(job.deadline)
  const isSaved = saved.includes(job.id)

  return (
    <article onClick={() => onSelect(job)} className="job-card" style={{
      background:C.card, border:active?`2px solid ${C.red}`:`1px solid ${C.border}`,
      borderRadius:12, padding:"14px 14px 12px", marginBottom:8, cursor:"pointer",
      boxShadow:active?`0 0 0 3px ${C.redSoft}`:"none",
      opacity:d.closed?.55:1, position:"relative",
    }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <ScoreRing score={match?.score||0} size={44} locked={!match && !!job.ai_match_fields} unscored={!match && !job.ai_match_fields}/>
        
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:4 }}>
            {job.isNew && !d.closed && d.daysLeft > 7 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:C.greenSoft, color:C.green, textTransform:"uppercase" }}>New</span>}
            {d.closed && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:C.borderLight, color:C.text3 }}>Closed</span>}
            {!d.closed && isManagement(job.title) && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#EDE9FE", color:"#6D28D9", textTransform:"uppercase" }}>Management</span>}
            {followed && !d.closed && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#FEF3C7", color:"#92400E" }}>⭐ Following</span>}
            {!d.closed && job.posts >= 20 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#DBEAFE", color:"#1D4ED8", textTransform:"uppercase" }}>Mass Recruitment</span>}
          </div>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.text, lineHeight:1.35, marginBottom:3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{job.title}</h3>
          <p style={{ fontSize:12, color:C.text2, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{job.employer}</p>
          
          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.text3 }}>
            <span>{job.county}</span>
            <span style={{ color:C.border }}>·</span>
            <span style={{ fontWeight:600, color:d.urgent?C.white:d.color, background:d.urgent?C.red:"transparent", padding:d.urgent?"2px 7px":"0", borderRadius:d.urgent?4:0, fontSize:d.urgent?10:11 }}>{d.text}</span>
            {match && <><span style={{ color:C.border }}>·</span><span style={{ fontWeight:600, color:matchColor(match.score) }}>{match.metCount}/{match.totalCount} met</span></>}
          </div>
        </div>
        
        <button onClick={e => { e.stopPropagation(); onSave(job.id) }} style={{ background:"none", border:"none", cursor:"pointer", color:isSaved?C.red:C.border, padding:4, flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill={isSaved?"currentColor":"none"}><path d="M8 12L3 15V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12l-5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </article>
  )
})

// ─── JOB DETAIL ──────────────────────────────────────────────
