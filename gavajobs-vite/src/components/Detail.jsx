import { useState, useMemo, useRef, useEffect } from 'react'
import ScoreRing from './ScoreRing'
import { ALL_JOBS } from '../constants/jobs'
import { C } from '../constants/theme'
import { computeMatch, isManagement } from '../services/matchingEngine'
import { matchColor, matchLabel, dl, ini, waShare } from '../utils/helpers'
import { PROF_QUALS } from '../constants/profQuals'
import { PROF_BODIES } from '../constants/profBodies'

export default function Detail({ job, saved, onSave, onClose, profile, onBuildProfile, getMatch, onSelect, followedEmps, onToggleFollow, premium, onUnlockPremium }) {
  const ref = useRef(null)
  const [showPayment, setShowPayment] = useState(false)
  const [phone, setPhone] = useState("")
  const [payState, setPayState] = useState("idle") // idle | sending | waiting | success | error
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0 }, [job?.id])
  
  if (!job) {
    const now = new Date()
    const openCount = ALL_JOBS.filter(j => j.open && new Date(j.deadline+"T17:00:00+03:00") >= now).length
    const closingSoon = ALL_JOBS.filter(j => {
      if (!j.open) return false
      const deadlineTime = new Date(j.deadline+"T17:00:00+03:00")
      const now2 = new Date()
      if (now2 > deadlineTime) return false
      const diff = Math.ceil((deadlineTime - now2) / 864e5)
      return diff <= 14
    }).sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
    const employerCount = new Set(ALL_JOBS.filter(j=>j.open && new Date(j.deadline+"T17:00:00+03:00") >= now).map(j=>j.employer)).size

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto", scrollbarWidth:"thin" }}>
        {/* Hero section */}
        <div style={{ padding:"40px 24px 32px", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:3, marginBottom:20 }}>
            <span style={{ fontSize:10, fontWeight:700, color:C.white, background:C.green, padding:"3px 8px", borderRadius:4, textTransform:"uppercase", letterSpacing:".05em" }}>Free</span>
            <span style={{ fontSize:11, color:C.text3 }}>No sign-up required to browse</span>
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, color:C.text, lineHeight:1.25, marginBottom:10 }}>Know which jobs <span style={{ color:C.red }}>match</span><br/>your qualifications</h2>
          <p style={{ fontSize:14, color:C.text2, lineHeight:1.6, maxWidth:380, margin:"0 auto 24px" }}>
            We analyse every Kenya government job vacancy and tell you exactly which requirements you meet — so you can apply with confidence.
          </p>

          {!profile ? (
            <button onClick={onBuildProfile} style={{ fontFamily:"inherit", fontSize:15, fontWeight:700, padding:"14px 32px", borderRadius:12, background:C.red, color:C.white, border:"none", cursor:"pointer", marginBottom:8, boxShadow:"0 2px 8px rgba(200,16,46,.25)" }}>
              Build your profile — takes 2 minutes
            </button>
          ) : (
            <p style={{ fontSize:13, color:C.green, fontWeight:600 }}>✓ Profile active — tap any job to see your match</p>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ display:"flex", justifyContent:"center", gap:0, margin:"0 20px 28px", background:C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ flex:1, padding:"14px 8px", textAlign:"center", borderRight:`1px solid ${C.border}` }}>
            <div style={{ fontSize:22, fontWeight:800, color:C.green }}>{openCount}</div>
            <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:"uppercase", letterSpacing:".04em" }}>Open jobs</div>
          </div>
          <div style={{ flex:1, padding:"14px 8px", textAlign:"center", borderRight:`1px solid ${C.border}` }}>
            <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{employerCount}</div>
            <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:"uppercase", letterSpacing:".04em" }}>Employers</div>
          </div>
          <div style={{ flex:1, padding:"14px 8px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:C.text }}>7</div>
            <div style={{ fontSize:10, fontWeight:600, color:C.text3, textTransform:"uppercase", letterSpacing:".04em" }}>Match checks</div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding:"0 24px 28px" }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:14 }}>How it works</p>
          {[
            { icon:"📋", title:"Build your profile", desc:"Education, qualifications, experience — 2 minutes" },
            { icon:"🎯", title:"See your match score", desc:"Every job gets a percentage score based on 7 requirements" },
            { icon:"✅", title:"Know exactly what you meet", desc:"Green checks for requirements you have, clear gaps where you don't" },
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{s.title}</div>
                <div style={{ fontSize:12, color:C.text2, lineHeight:1.4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Closing soon */}
        {closingSoon.length > 0 && (
          <div style={{ padding:"0 24px 32px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
              <span style={{ fontSize:14 }}>⏰</span>
              <span style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:".04em" }}>Closing soon</span>
            </div>
            {closingSoon.slice(0, 5).map(j => {
              const d = dl(j.deadline)
              return (
                <div key={j.id} onClick={() => onSelect && onSelect(j)} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:d.urgent?C.redSoft:C.white, border:`1px solid ${d.urgent?C.red+"30":C.border}`, borderRadius:10, marginBottom:8, cursor:"pointer" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.title}</div>
                    <div style={{ fontSize:11, color:C.text2 }}>{j.employer.split("(")[0].trim()}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:d.urgent?C.red:d.color }}>{d.text}</div>
                    {j.posts > 1 && <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{j.posts} posts</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const d = dl(job.deadline)
  const match = getMatch ? getMatch(job.id) : null
  const isSaved = saved.includes(job.id)

  return (
    <div ref={ref} style={{ height:"100%", overflowY:"auto", scrollbarWidth:"thin" }}>
      <div style={{ maxWidth:680, padding:"20px 0 40px" }}>
        <button onClick={onClose} className="mob-back" style={{ display:"none", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:C.text2, fontSize:13, fontWeight:500, marginBottom:14, fontFamily:"inherit" }}>← Back</button>
        
        {/* Header */}
        <div style={{ display:"flex", gap:14, alignItems:"flex-start", paddingBottom:18, borderBottom:`1px solid ${C.border}`, marginBottom:18 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:C.black, color:C.white, fontSize:16, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{ini(job.employer)}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
              {job.isNew && !d.closed && d.daysLeft > 7 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:C.greenSoft, color:C.green, textTransform:"uppercase" }}>New</span>}
              {isManagement(job.title) && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#EDE9FE", color:"#6D28D9", textTransform:"uppercase" }}>Management</span>}
              {job.posts >= 20 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#DBEAFE", color:"#1D4ED8", textTransform:"uppercase" }}>Mass Recruitment</span>}
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.text, lineHeight:1.25, marginBottom:5 }}>{job.title}</h2>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <p style={{ fontSize:14, color:C.text2, margin:0 }}>{job.employer}</p>
              {profile && <button onClick={() => onToggleFollow && onToggleFollow(job.employer)} title={followedEmps?.includes(job.employer) ? "Unfollow employer" : "Follow employer"} style={{ background:"none", border:"none", cursor:"pointer", padding:2, fontSize:16, lineHeight:1, color:followedEmps?.includes(job.employer)?"#F59E0B":"#D1D5DB" }}>
                {followedEmps?.includes(job.employer) ? "★" : "☆"}
              </button>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text2, flexWrap:"wrap" }}>
              <span>{job.county}</span>
              <span style={{ color:C.border }}>·</span>
              <span>{job.edu}</span>
              {job.posts>1 && <><span style={{ color:C.border }}>·</span><span>{job.posts} posts</span></>}
              <span style={{ color:C.border }}>·</span>
              <span style={{ fontWeight:600, color:d.urgent?C.white:d.color, background:d.urgent?C.red:"transparent", padding:d.urgent?"2px 8px":"0", borderRadius:d.urgent?4:0 }}>{d.text}</span>
            </div>
          </div>
        </div>

        {/* The Job At A Glance (free) */}
        {job.ai_summary && (
          <div style={{ background:C.blueSoft, border:`1px solid #BFDBFE`, borderRadius:10, padding:16, marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:C.blue }}/>
              <span style={{ fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:".04em" }}>The Job At A Glance</span>
            </div>
            <p style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{job.ai_summary}</p>
          </div>
        )}

        {/* Match section */}
        {match ? (
          <div style={{ background:matchColor(match.score)+"10", border:`1.5px solid ${matchColor(match.score)}30`, borderRadius:12, padding:18, marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
              <ScoreRing score={match.score} size={56}/>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:matchColor(match.score) }}>{matchLabel(match.score)}</div>
                <div style={{ fontSize:13, color:C.text2 }}>You meet {match.metCount} of {match.totalCount} requirements</div>
              </div>
            </div>
            {/* Requirement checklist — PREMIUM */}
            {premium ? (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {match.overqualified && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.red, background:C.redSoft, padding:"8px 10px", borderRadius:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>✗</span>
                  <span style={{ lineHeight:"20px" }}>This role requires {match.checks[0]?.label || "a lower qualification level"} — it's intended for a different qualification band than yours. Your match score has been set to 0%.</span>
                </div>
              )}
              {match.wrongField && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"#92400E", background:"#FEF3C7", padding:"10px 12px", borderRadius:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>⚠</span>
                  <span style={{ lineHeight:"20px" }}>Your degree field differs from this role's requirements. Government panels filter by field of study first — but read the full advert, as some interpret "or related" broadly.</span>
                </div>
              )}
              {match.underqualified && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.red, background:C.redSoft, padding:"8px 10px", borderRadius:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>✗</span>
                  <span style={{ lineHeight:"20px" }}>This role requires {match.checks[0]?.label || "a higher qualification"} — your current education level does not meet the minimum. In government shortlisting, applications below the stated education level are eliminated.</span>
                </div>
              )}
              {match.checks.map((c, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.text2 }}>
                  <span style={{ color:c.met?C.green:C.red, fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{c.met?"✓":"✗"}</span>
                  <div>
                    <span style={{ lineHeight:"20px" }}>{c.label}</span>
                    {c.note && <p style={{ fontSize:11, color:C.amber, marginTop:2, fontStyle:"italic" }}>↳ {c.note}</p>}
                    {c.hint && <p style={{ fontSize:11, color:C.amber, marginTop:2, fontStyle:"italic" }}>💡 {c.hint}</p>}
                  </div>
                </div>
              ))}
              {match.specials && match.specials.length > 0 && (
                <>
                  <div style={{ fontSize:11, fontWeight:700, color:job.edu === "KCSE" || job.edu === "Certificate" ? C.red : C.amber, textTransform:"uppercase", letterSpacing:".04em", marginTop:8 }}>
                    {job.edu === "KCSE" || job.edu === "Certificate" ? "You must also have (not scored)" : "Also required (self-assess)"}
                  </div>
                  {match.specials.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color: job.edu === "KCSE" || job.edu === "Certificate" ? C.red : C.amber }}>
                      <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{job.edu === "KCSE" || job.edu === "Certificate" ? "⚠" : "⚡"}</span>
                      <span style={{ lineHeight:"20px" }}>{s.label}</span>
                    </div>
                  ))}
                </>
              )}
              {match.skills && match.skills.length > 0 && (
                <>
                  <div style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".04em", marginTop:8 }}>This role also requires</div>
                  {match.skills.map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text3 }}>
                      <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>📋</span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </>
              )}
              {job.flag && job.flag.toLowerCase().includes("alternative path") && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"#92400E", background:"#FEF3C7", padding:"10px 12px", borderRadius:8, marginTop:10 }}>
                  <span style={{ fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>⚠</span>
                  <span style={{ lineHeight:"20px" }}>This position offers alternative qualification pathways. Your score is based on one route — read the full requirements carefully as you may qualify through a different combination of education and experience.</span>
                </div>
              )}
            </div>
            ) : (
            <div style={{ position:"relative", marginTop:8 }}>
              {/* Blurred preview — show first 2 checks then blur */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {match.checks.slice(0, 2).map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.text2 }}>
                    <span style={{ color:c.met?C.green:C.red, fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{c.met?"✓":"✗"}</span>
                    <span style={{ lineHeight:"20px" }}>{c.label}</span>
                  </div>
                ))}
              </div>
              {match.checks.length > 2 && (
                <div style={{ position:"relative", marginTop:4 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, filter:"blur(6px)", opacity:0.5, pointerEvents:"none", userSelect:"none" }}>
                    {match.checks.slice(2, 5).map((c, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:C.text2 }}>
                        <span style={{ color:c.met?C.green:C.red, fontWeight:700, fontSize:14, lineHeight:"20px", flexShrink:0 }}>{c.met?"✓":"✗"}</span>
                        <span style={{ lineHeight:"20px" }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div onClick={() => setShowPayment(true)} style={{ background:C.white, border:`2px solid ${C.red}`, borderRadius:12, padding:"14px 20px", cursor:"pointer", textAlign:"center", boxShadow:"0 4px 20px rgba(0,0,0,.1)" }}>
                      <div style={{ fontSize:18, marginBottom:6 }}>🔓</div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>See full match breakdown</div>
                      <div style={{ fontSize:12, color:C.text2, marginBottom:10, lineHeight:1.4 }}>Find out exactly which requirements you meet and what you're missing</div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.white, background:C.red, padding:"8px 20px", borderRadius:8, display:"inline-block" }}>Unlock — KES 199/mo</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* ── CAREER TIP: actionable advice for close-but-not-quite candidates — PREMIUM ── */}
            {premium && match.score >= 25 && match.score < 80 && !match.overqualified && (() => {
              const tips = []
              const failedChecks = match.checks.filter(c => !c.met)
              
              const missingQual = failedChecks.find(c => c.category === "qualification")
              if (missingQual) {
                const qualName = missingQual.label.replace(" (required)","")
                tips.push(`Getting your ${qualName} would make you eligible for this and similar roles across government. In government recruitment, professional qualifications are treated as mandatory requirements — missing one means your application is eliminated before scoring begins.`)
              }
              
              const missingBody = failedChecks.find(c => c.category === "membership")
              if (missingBody) {
                const bodyName = missingBody.label.replace(" membership (required)","")
                tips.push(`Register with ${bodyName}. Government verifies active membership at appointment.`)
              }
              
              const missingExp = failedChecks.find(c => c.category === "experience")
              if (missingExp) {
                tips.push("You need more experience for this grade. Look for lower-grade versions of the same position — agencies often advertise at different grades (e.g. Officer II vs Officer I) with lower experience thresholds.")
              }
              
              const missingMgmt = failedChecks.find(c => c.category === "management")
              if (missingMgmt) {
                tips.push("Management experience is counted strictly — you need verifiable time supervising staff. Consider roles at a lower grade that don't require management experience, and build up from there.")
              }
              
              const missingLeadership = failedChecks.find(c => c.category === "leadership")
              if (missingLeadership) {
                tips.push("Senior roles require a leadership course (4+ weeks). Kenya School of Government runs SLDP and SMC regularly — open to private sector applicants. Equivalent courses from recognised institutions also count.")
              }
              
              if (match.wrongField) {
                tips.push("This role needs a different degree field. Use the search or sector filters to find roles that match your actual qualification — there are often government positions you wouldn't expect that fit your background.")
              }
              
              const relatedField = match.checks.find(c => c.category === "field" && c.met && c.matchType === "related")
              if (relatedField && !missingQual) {
                tips.push("Your degree matched as a related field under GoK classification — you're eligible but may lose points to candidates with the named degree. In your application, explain how your field of study is relevant to the named fields. A bridging professional qualification (e.g. CPA(K) for finance roles) can also close that gap.")
              }
              const conditionalField = match.checks.find(c => c.category === "field" && c.met && c.matchType === "conditional")
              if (conditionalField) {
                tips.push("Your degree qualified through a bridging qualification — this is a valid path but scores lower. Consider pursuing a postgraduate qualification in the named field to strengthen future applications.")
              }
              
              if (tips.length > 0) return (
                <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:16, marginTop:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                    <span style={{ fontSize:14 }}>💡</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#059669", textTransform:"uppercase", letterSpacing:".03em" }}>How to strengthen your profile</span>
                  </div>
                  {tips.map((tip, i) => (
                    <p key={i} style={{ fontSize:13, color:"#065F46", lineHeight:1.65, marginBottom:i<tips.length-1?10:0 }}>{tip}</p>
                  ))}
                </div>
              )
              return null
            })()}
            {/* ── INTERVIEW PREP TIP — PREMIUM ── */}
            {premium && match.score >= 80 && !match.overqualified && !match.wrongField && (
              <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:16, marginTop:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:14 }}>🎯</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#059669", textTransform:"uppercase", letterSpacing:".03em" }}>You're a strong candidate — prepare to stand out</span>
                </div>
                <p style={{ fontSize:13, color:"#065F46", lineHeight:1.65, marginBottom:8 }}>With your strong match for the role, prepare well in case you get shortlisted. To perform well at interview:</p>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {match.checks.find(c => c.category === "field" && c.met && c.matchType === "related") && (
                    <p style={{ fontSize:13, color:"#065F46", lineHeight:1.65, margin:0 }}>• <strong>Address your field of study</strong> — your degree matched as a related field. In your application, explain how your qualification is relevant to the named fields. This helps the shortlisting panel justify scoring you alongside candidates with the exact degree.</p>
                  )}
                  <p style={{ fontSize:13, color:"#065F46", lineHeight:1.65, margin:0 }}>• <strong>Chapter Six clearances</strong> — have your KRA tax compliance, EACC self-declaration, CRB report, DCI certificate, and HELB clearance ready. You'll need them at offer stage.</p>
                  <p style={{ fontSize:13, color:"#065F46", lineHeight:1.65, margin:0 }}>• <strong>Article 10 & 232 values</strong> — panels ask how you demonstrate integrity, transparency, accountability, and public participation. Prepare specific examples.</p>
                  <p style={{ fontSize:13, color:"#065F46", lineHeight:1.65, margin:0 }}>• <strong>Know the agency</strong> — read {job.employer}'s mandate, strategic plan, and enabling legislation. Panels favour candidates who understand the organisation's mission.</p>
                </div>
              </div>
            )}
            {match.score >= 80 && !match.overqualified && !match.wrongField && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 14px", marginTop:10 }}>
                <p style={{ fontSize:11, color:"#991B1B", lineHeight:1.5, margin:0, fontWeight:500 }}>
                  Strong matching scores are indicative and do not guarantee shortlisting. The employing agency will make its decision independently.
                </p>
              </div>
            )}
          </div>
        ) : profile && !job.ai_match_fields ? (
          <div style={{ background:C.borderLight, border:`1.5px dashed ${C.border}`, borderRadius:12, padding:18, marginBottom:18, textAlign:"center" }}>
            <ScoreRing score={0} size={48} unscored={true}/>
            {job.edu === "KCSE" || job.edu === "Certificate" ? (
              <>
                <p style={{ fontSize:14, fontWeight:600, color:C.text, marginTop:10 }}>Scoring not applicable</p>
                <p style={{ fontSize:12, color:C.text3, marginTop:4, lineHeight:1.5 }}>This is a {job.edu}-level role. The matching engine scores Diploma and above. Check the requirements below — you typically need {job.edu}{job.ai_match_fields === null && job.requirements?.find(r => /driving|driver/i.test(r)) ? ", a valid driving licence, and driving experience" : " and the specific qualifications listed"}.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize:14, fontWeight:600, color:C.text, marginTop:10 }}>This job can't be scored yet</p>
                <p style={{ fontSize:12, color:C.text3, marginTop:4, lineHeight:1.5 }}>This is a bundled advert or the requirements haven't been fully extracted yet. Read the full requirements below to assess your fit.</p>
              </>
            )}
          </div>
        ) : (
          <div onClick={onBuildProfile} style={{ background:C.borderLight, border:`1.5px dashed ${C.border}`, borderRadius:12, padding:18, marginBottom:18, cursor:"pointer", textAlign:"center" }}>
            <ScoreRing score={0} size={48} locked={true}/>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, marginTop:10 }}>Build your profile to see your match score</p>
            <p style={{ fontSize:12, color:C.text3, marginTop:4 }}>Takes 2 minutes · See which requirements you meet</p>
            <button style={{ marginTop:12, fontFamily:"inherit", fontSize:13, fontWeight:600, padding:"10px 24px", borderRadius:8, background:C.red, color:C.white, border:"none", cursor:"pointer" }}>Build Profile</button>
          </div>
        )}
        
        {/* Action buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {!d.closed && (() => {
            const urlMatch = (job.howToApply||"").match(/https?:\/\/[^\s,)]+|www\.[^\s,)]+/)
            const emailMatch = (job.howToApply||"").match(/[\w.-]+@[\w.-]+\.\w+/)
            const applyUrl = urlMatch ? (urlMatch[0].startsWith("http") ? urlMatch[0] : "https://"+urlMatch[0]) : null
            const applyEmail = !applyUrl && emailMatch ? emailMatch[0] : null
            const domain = applyUrl ? applyUrl.replace(/https?:\/\/(www\.)?/,"").split("/")[0] : null
            
            return (
              <div style={{ flex:"1 1 auto" }}>
                <a href={applyUrl || (applyEmail ? `mailto:${applyEmail}?subject=Application: ${job.ref||job.title}` : "#how-to-apply")} target={applyUrl?"_blank":"_self"} rel="noreferrer" onClick={e => { if (!applyUrl && !applyEmail) { e.preventDefault(); const el=document.getElementById("how-to-apply"); if(el) el.scrollIntoView({behavior:"smooth"}) }}} style={{ display:"block", background:C.red, color:C.white, fontFamily:"inherit", fontSize:14, fontWeight:600, padding:"12px 20px", borderRadius:10, cursor:"pointer", textDecoration:"none", textAlign:"center" }}>
                  {domain ? `Apply at ${domain}` : applyEmail ? `Email ${applyEmail}` : "See how to apply"}
                </a>
                {domain && <p style={{ fontSize:11, color:C.text3, marginTop:4, textAlign:"center", wordBreak:"break-all" }}>{applyUrl}</p>}
              </div>
            )
          })()}
          <button onClick={() => onSave(job.id)} style={{ background:isSaved?C.redSoft:C.borderLight, color:isSaved?C.red:C.text2, border:`1.5px solid ${isSaved?C.red:C.border}`, fontFamily:"inherit", fontSize:13, fontWeight:500, padding:"12px 16px", borderRadius:10, cursor:"pointer" }}>{isSaved?"✓ Saved":"Save"}</button>
          <button onClick={() => waShare(job)} style={{ background:C.borderLight, color:C.text2, border:`1.5px solid ${C.border}`, fontFamily:"inherit", fontSize:13, fontWeight:500, padding:"12px 14px", borderRadius:10, cursor:"pointer" }}>Share</button>
        </div>
        
        {/* Quick facts */}
        <div style={{ marginBottom:20 }}>
          <h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Quick facts</h4>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
            {[["Grade",job.grade],["Sector",job.sector],["Reference",job.ref]].filter(([k,v]) => v && v !== "" && v !== "See advert").map(([k,v],i,a) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom:i<a.length-1?`1px solid ${C.border}`:"none", fontSize:13 }}>
                <span style={{ color:C.text2 }}>{k}</span>
                <span style={{ color:C.text, fontWeight:500, textAlign:"right", maxWidth:"60%" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {job.about && <div style={{ marginBottom:20 }}><h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>About</h4><p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>{job.about}</p></div>}

        {job.responsibilities?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Key responsibilities</h4>
            {job.responsibilities.map((r,i) => (
              <div key={i} style={{ fontSize:13, color:C.text2, lineHeight:1.6, paddingLeft:16, position:"relative", marginBottom:6 }}>
                <span style={{ position:"absolute", left:0, color:C.text3 }}>•</span>{r}
              </div>
            ))}
          </div>
        )}

        {job.requirements?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>Requirements</h4>
            {job.requirements.map((r,i) => (
              <div key={i} style={{ fontSize:13, color:C.text2, lineHeight:1.6, paddingLeft:16, position:"relative", marginBottom:6 }}>
                <span style={{ position:"absolute", left:0, color:C.green }}>✓</span>{r}
              </div>
            ))}
          </div>
        )}

        {/* Additional requirements (skills, special reqs) — visible to everyone */}
        {(() => {
          const mf = job.ai_match_fields
          const extras = [...(mf?.key_skills||[]), ...(mf?.special_requirements||[])]
          if (extras.length === 0) return null
          return (
            <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:10, padding:14, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#6D28D9", marginBottom:8 }}>THIS ROLE ALSO REQUIRES</div>
              {extras.map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#5B21B6", marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:13, flexShrink:0 }}>⚡</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {job.chapterSix && (
          <div style={{ background:C.amberSoft, border:`1px solid #F0D9A0`, borderRadius:10, padding:14, marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.amberDark, marginBottom:6 }}>CHAPTER SIX</div>
            <p style={{ fontSize:12, color:C.amberDark, lineHeight:1.5 }}>This role requires Chapter Six compliance — but proof is only needed <b>once you're offered the job</b>, not at application time. Don't let missing clearances stop you from applying.</p>
          </div>
        )}
        
        {job.howToApply && <div id="how-to-apply" style={{ marginBottom:20 }}><h4 style={{ fontSize:12, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".05em", marginBottom:10 }}>How to apply</h4><p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>{job.howToApply}</p></div>}
      </div>

      {/* M-Pesa Payment Modal — rendered at top level for proper z-index */}
      {showPayment && (
        <div onClick={() => payState === "idle" && setShowPayment(false)} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:C.white, borderRadius:16, width:"100%", maxWidth:380, maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            {/* Header stripe */}
            <div style={{ height:4, background:`linear-gradient(90deg,${C.black} 33%,${C.red} 33% 66%,${C.green} 66%)` }}/>
            
            <div style={{ padding:"24px 20px" }}>
              {payState === "success" ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:18, fontWeight:700, color:C.green, marginBottom:6 }}>Payment received!</div>
                  <div style={{ fontSize:14, color:C.text2, marginBottom:20 }}>GavaJobs Pro is now active on your account.</div>
                  <button onClick={() => { setShowPayment(false); setPayState("idle"); onUnlockPremium && onUnlockPremium() }} style={{ fontFamily:"inherit", fontSize:14, fontWeight:600, padding:"12px 32px", borderRadius:10, background:C.green, color:C.white, border:"none", cursor:"pointer" }}>Start exploring</button>
                </div>
              ) : (
                <>
                  {/* Price */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:C.text2 }}>Ksh</span>
                      <span style={{ fontSize:36, fontWeight:800, color:C.text, lineHeight:1 }}>200</span>
                    </div>
                    <div style={{ fontSize:13, color:C.text3, marginTop:2 }}>Per month · Cancel anytime</div>
                  </div>

                  {/* Benefits */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                    {[
                      "Full match breakdown on every job — see exactly what you meet and what you're missing",
                      "Career tips — personalised advice on closing gaps in your qualifications",
                      "Interview prep insights for jobs where you're a strong match",
                      "Priority weekly email alerts — delivered Tuesday morning before free users",
                    ].map((b, i) => (
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <span style={{ width:20, height:20, borderRadius:"50%", background:C.greenSoft, color:C.green, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>✓</span>
                        <span style={{ fontSize:13, color:C.text, lineHeight:1.45 }}>{b}</span>
                      </div>
                    ))}
                  </div>

                  {/* M-Pesa input */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>M-Pesa phone number</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4, background:C.borderLight, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", flexShrink:0, fontSize:14, fontWeight:600, color:C.text }}>
                        🇰🇪 +254
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,9))}
                        placeholder="7XX XXX XXX"
                        disabled={payState !== "idle"}
                        style={{ flex:1, fontFamily:"inherit", fontSize:16, fontWeight:500, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, outline:"none", color:C.text, letterSpacing:".5px" }}
                      />
                    </div>
                    {payState === "idle" && <p style={{ fontSize:11, color:C.text3, marginTop:6 }}>You'll receive an M-Pesa STK push to confirm</p>}
                  </div>

                  {/* Pay button / status */}
                  {payState === "idle" && (
                    <button
                      onClick={() => {
                        if (phone.length < 9) return
                        setPayState("sending")
                        setTimeout(() => setPayState("waiting"), 1500)
                        setTimeout(() => setPayState("success"), 5000)
                      }}
                      disabled={phone.length < 9}
                      style={{ width:"100%", fontFamily:"inherit", fontSize:15, fontWeight:700, padding:"14px 20px", borderRadius:10, background:phone.length >= 9 ? "#E5A100" : C.border, color:phone.length >= 9 ? C.white : C.text3, border:"none", cursor:phone.length >= 9 ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                    >
                      <span style={{ fontSize:18 }}>📱</span> Pay Ksh 199 via M-Pesa
                    </button>
                  )}

                  {payState === "sending" && (
                    <div style={{ textAlign:"center", padding:"12px 0" }}>
                      <div style={{ width:24, height:24, border:"3px solid #E5E7EB", borderTopColor:"#E5A100", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 10px" }}/>
                      <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Sending STK push to 0{phone}…</div>
                    </div>
                  )}

                  {payState === "waiting" && (
                    <div style={{ textAlign:"center", padding:"12px 0" }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📱</div>
                      <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>Check your phone</div>
                      <div style={{ fontSize:13, color:C.text2 }}>Enter your M-Pesa PIN on the prompt sent to 0{phone}</div>
                      <div style={{ width:24, height:24, border:"3px solid #E5E7EB", borderTopColor:C.green, borderRadius:"50%", animation:"spin .7s linear infinite", margin:"14px auto 0" }}/>
                      <div style={{ fontSize:11, color:C.text3, marginTop:8 }}>Waiting for confirmation…</div>
                    </div>
                  )}

                  {/* Cancel link */}
                  {payState === "idle" && (
                    <div style={{ textAlign:"center", marginTop:12 }}>
                      <button onClick={() => setShowPayment(false)} style={{ background:"none", border:"none", fontSize:12, color:C.text3, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>Not now</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ────────────────────────────────────────────────
