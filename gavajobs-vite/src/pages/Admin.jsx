import { useState, useMemo, useCallback, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { PROF_QUALS } from '../constants/profQuals'
import { PROF_BODIES } from '../constants/profBodies'
import { FIELD_PILLS } from '../constants/fieldPills'
import { SECTORS } from '../constants/sectors'
import { EDU_LEVELS } from '../constants/education'



const EDU_RANK = { KCSE:0, Certificate:1, Diploma:2, Degree:3, Masters:4, PhD:5 }

const EMPTY_JOB = {
  id:"", title:"", employer:"", sector:"Other", county:"Nairobi", edu:"Degree",
  posts:1, grade:"", ref:"", deadline:"", addedDate:"", about:"",
  responsibilities:[""], requirements:[""], howToApply:"", chapterSix:true,
  ai_summary:"", flag:"", status:"draft", isNew:true, src:"MyGov",
  ai_match_fields: {
    edu_min:"Degree", edu_fields:[], edu_fields_masters:null, edu_fields_bachelors:null,
    prof_quals_required:[], prof_quals_required_groups:[], prof_quals_preferred:[],
    years_experience:0, years_management:0, prof_bodies_required:[], prof_bodies_required_groups:[],
    prof_bodies_preferred:[], leadership_course:false, key_skills:[],
    special_requirements:[]
  }
}

const P = {
  bg:"#0F1117", surface:"#1A1D27", surface2:"#242836",
  border:"#2E3344", borderLight:"#383D52",
  text:"#E8E9ED", text2:"#9CA3B4", text3:"#636B80",
  accent:"#C8102E", accentSoft:"#C8102E18",
  green:"#10B981", greenSoft:"#10B98118",
  amber:"#F59E0B", amberSoft:"#F59E0B18",
  blue:"#3B82F6", blueSoft:"#3B82F618",
  red:"#EF4444", redSoft:"#EF444418",
}

const btn = (bg, c, bd) => ({
  fontSize:12, fontWeight:600, padding:"8px 14px", borderRadius:8,
  background:bg, color:c, border:bd||"none", cursor:"pointer", fontFamily:"inherit"
})
const inputS = {
  width:"100%", fontFamily:"inherit", fontSize:13, padding:"8px 10px",
  borderRadius:8, border:`1px solid ${P.border}`, background:P.surface,
  color:P.text, outline:"none", boxSizing:"border-box"
}

function StatusPill({ status, deadline }) {
  const n = new Date()
  const d = deadline ? new Date(deadline + "T17:00:00+03:00") : null
  const dy = d ? Math.ceil((d - n) / 864e5) : null
  const expired = d && n > d
  if (status === "draft") return (
    <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px",
      borderRadius:6, background:P.blueSoft, color:P.blue }}>Draft</span>
  )
  if (status === "unpublished" || expired) return (
    <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px",
      borderRadius:6, background:P.redSoft, color:P.red }}>{expired ? "Expired" : "Unpublished"}</span>
  )
  if (status === "published" && dy !== null && dy <= 7) return (
    <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px",
      borderRadius:6, background:P.amberSoft, color:P.amber }}>{dy}d left</span>
  )
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px",
      borderRadius:6, background:P.greenSoft, color:P.green }}>Published</span>
  )
}

function TagInput({ value=[], onChange, options=[], placeholder="Add..." }) {
  const [input, setInput] = useState("")
  const add = (v) => {
    if (v && !value.includes(v)) { onChange([...value, v]); setInput("") }
  }
  const remove = (v) => onChange(value.filter(x => x !== v))
  const fl = options.filter(o =>
    o.toLowerCase().includes(input.toLowerCase()) && !value.includes(o)
  )
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:value.length?6:0 }}>
        {value.map(v => (
          <span key={v} style={{
            display:"inline-flex", alignItems:"center", gap:4, fontSize:11,
            fontWeight:600, padding:"3px 6px 3px 8px", borderRadius:6,
            background:P.blueSoft, color:P.blue
          }}>
            {v}
            <button onClick={() => remove(v)} style={{
              background:"none", border:"none", color:P.blue,
              cursor:"pointer", fontSize:13, lineHeight:1, padding:0
            }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ position:"relative" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && input.trim()) { e.preventDefault(); add(input.trim()) }
          }}
          placeholder={placeholder} style={inputS} />
        {input && fl.length > 0 && (
          <div style={{
            position:"absolute", top:"100%", left:0, right:0, maxHeight:160,
            overflowY:"auto", background:P.surface2, border:`1px solid ${P.border}`,
            borderRadius:8, marginTop:4, zIndex:10
          }}>
            {fl.slice(0,8).map(o => (
              <div key={o} onClick={() => add(o)} style={{
                padding:"8px 10px", fontSize:12, color:P.text2,
                cursor:"pointer", borderBottom:`1px solid ${P.border}`
              }}
              onMouseEnter={e => e.target.style.background = P.border}
              onMouseLeave={e => e.target.style.background = "transparent"}>
                {o}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CheckGroup({ value=[], onChange, options=[] }) {
  const toggle = (id) => onChange(
    value.includes(id) ? value.filter(x => x !== id) : [...value, id]
  )
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => toggle(o.id)} style={{
          fontSize:11, fontWeight:600, padding:"5px 10px", borderRadius:6,
          cursor:"pointer", fontFamily:"inherit",
          border:`1px solid ${value.includes(o.id) ? P.green : P.border}`,
          background:value.includes(o.id) ? P.greenSoft : "transparent",
          color:value.includes(o.id) ? P.green : P.text3,
          transition:"all .15s"
        }}>
          {value.includes(o.id) && "✓ "}{o.label}
        </button>
      ))}
    </div>
  )
}

function ListEditor({ value=[""], onChange, placeholder="Paste or type, one per line..." }) {
  const text = value.filter(v => v).join("\n")
  return (
    <div>
      <textarea value={text} onChange={e => {
        const items = e.target.value.split("\n").map(l =>
          l.replace(/^[\s•·\-\*\d]+[\.\)]\s*/, "")
           .replace(/^[\s•·\-\*]+\s*/, "").trim()
        )
        onChange(items.length ? items : [""])
      }} placeholder={placeholder} style={{
        ...inputS, minHeight:100, resize:"vertical", lineHeight:1.6
      }} />
      <div style={{ fontSize:11, color:P.text3, marginTop:4 }}>
        {value.filter(v => v).length} items
      </div>
    </div>
  )
}

function Field({ label, children, hint, required }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{
        display:"block", fontSize:11, fontWeight:700, color:P.text2,
        textTransform:"uppercase", letterSpacing:".05em", marginBottom:5
      }}>
        {label}
        {required && <span style={{ color:P.red, marginLeft:3 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{
          fontSize:11, color:hint.startsWith("⚠") ? P.amber : P.text3,
          marginTop:4, lineHeight:1.4
        }}>{hint}</p>
      )}
    </div>
  )
}

function ImportPreview({ incoming, existing, onConfirm, onCancel }) {
  const em = {}
  existing.forEach(j => { em[j.id] = j })
  const ek = new Set(existing.map(j =>
    `${j.employer}|${j.title}|${j.deadline}`
  ))
  const nw = [], up = [], sk = []
  incoming.forEach(j => {
    const k = `${j.employer}|${j.title}|${j.deadline}`
    if (em[j.id]) up.push(j)
    else if (ek.has(k)) sk.push(j)
    else nw.push(j)
  })
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100
    }}>
      <div style={{
        background:P.surface, border:`1px solid ${P.border}`, borderRadius:14,
        width:560, maxHeight:"80vh", overflow:"hidden",
        display:"flex", flexDirection:"column"
      }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${P.border}` }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:P.text, margin:0 }}>
            Import Preview
          </h3>
          <p style={{ fontSize:12, color:P.text2, marginTop:4 }}>
            {incoming.length} in file · {existing.length} in database
          </p>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
          {nw.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{
                fontSize:11, fontWeight:700, color:P.green,
                textTransform:"uppercase", letterSpacing:".05em", marginBottom:8
              }}>New ({nw.length})</div>
              {nw.slice(0,10).map(j => (
                <div key={j.id} style={{ fontSize:12, color:P.text2, padding:"4px 0" }}>
                  {j.id} · {j.title}
                </div>
              ))}
              {nw.length > 10 && (
                <div style={{ fontSize:11, color:P.text3 }}>+{nw.length-10} more</div>
              )}
            </div>
          )}
          {up.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{
                fontSize:11, fontWeight:700, color:P.amber,
                textTransform:"uppercase", letterSpacing:".05em", marginBottom:8
              }}>Updated ({up.length})</div>
              {up.slice(0,10).map(j => (
                <div key={j.id} style={{ fontSize:12, color:P.text2, padding:"4px 0" }}>
                  {j.id} · {j.title}
                </div>
              ))}
            </div>
          )}
          {sk.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{
                fontSize:11, fontWeight:700, color:P.text3,
                textTransform:"uppercase", marginBottom:8
              }}>Skipped ({sk.length})</div>
              {sk.slice(0,5).map((j,i) => (
                <div key={i} style={{ fontSize:12, color:P.text3, padding:"4px 0" }}>
                  {j.title}
                </div>
              ))}
            </div>
          )}
          {nw.length === 0 && up.length === 0 && (
            <p style={{ fontSize:13, color:P.text3 }}>No changes.</p>
          )}
        </div>
        <div style={{
          display:"flex", justifyContent:"flex-end", gap:8,
          padding:"16px 24px", borderTop:`1px solid ${P.border}`
        }}>
          <button onClick={onCancel}
            style={btn(P.surface, P.text2, `1px solid ${P.border}`)}>
            Cancel
          </button>
          {(nw.length > 0 || up.length > 0) && (
            <button onClick={() => onConfirm(nw, up)}
              style={btn(P.green, "#fff")}>
              Confirm: {nw.length} new, {up.length} updated
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function JobEditor({ job, onSave, onCancel, onDelete, isNew, existingJobs }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(job)))
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setMatch = (k, v) => setForm(p => ({
    ...p, ai_match_fields: { ...p.ai_match_fields, [k]: v }
  }))
  const mf = form.ai_match_fields || {}

  const handleSave = () => {
    if (isNew && existingJobs) {
      const dup = existingJobs.find(j =>
        j.employer === form.employer && j.title === form.title && j.deadline === form.deadline
      )
      if (dup && !safeConfirm(
        `A job with this employer, title, and deadline already exists (ID: ${dup.id}). Save anyway?`
      )) return
    }
    onSave(form)
  }

  const selS = { ...inputS, cursor:"pointer" }

  return (
    <div style={{ padding:"24px 28px", overflowY:"auto", height:"100%" }}>
      <div style={{
        display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:24
      }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:P.text, margin:0 }}>
          {isNew ? "Add New Job" : `Edit: ${form.title || "Untitled"}`}
        </h2>
        <div style={{ display:"flex", gap:8 }}>
          {!isNew && onDelete && (
            <button onClick={onDelete}
              style={btn(P.redSoft, P.red, `1px solid ${P.red}30`)}>Delete</button>
          )}
          <button onClick={onCancel}
            style={btn(P.surface, P.text2, `1px solid ${P.border}`)}>Cancel</button>
          <button onClick={handleSave}
            style={{ ...btn(P.green, "#fff"), fontWeight:700, padding:"8px 18px" }}>
            Save Job
          </button>
        </div>
      </div>

      <div style={{
        background:P.surface2, borderRadius:12, padding:"20px 20px 4px",
        marginBottom:16, border:`1px solid ${P.border}`
      }}>
        <h3 style={{
          fontSize:12, fontWeight:700, color:P.accent,
          textTransform:"uppercase", letterSpacing:".06em", marginBottom:16
        }}>Basic Information</h3>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Job ID" required>
            <input value={form.id}
              onChange={isNew ? undefined : e => set("id", e.target.value)}
              readOnly={isNew}
              style={{...inputS, ...(isNew ? {background:"#f0f0f0", color:"#999", cursor:"not-allowed"} : {})}} />
            {isNew && <div style={{fontSize:10, color:"#999", marginTop:2}}>Auto-assigned sequentially</div>}
          </Field>
          <Field label="Advert Reference">
            <input value={form.ref} onChange={e => set("ref", e.target.value)} style={inputS} />
          </Field>
        </div>

        <Field label="Job Title" required>
          <input value={form.title} onChange={e => set("title", e.target.value)} style={inputS} />
        </Field>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Employer" required>
            <input value={form.employer} onChange={e => set("employer", e.target.value)} style={inputS} />
          </Field>
          <Field label="Grade">
            <input value={form.grade} onChange={e => set("grade", e.target.value)} style={inputS} />
          </Field>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:"0 12px" }}>
          <Field label="Sector" hint="Pick or type">
            <input value={form.sector} onChange={e => set("sector", e.target.value)}
              list="sl" style={inputS} />
            <datalist id="sl">
              {SECTORS.map(s => <option key={s} value={s} />)}
            </datalist>
          </Field>
          <Field label="County">
            <input value={form.county} onChange={e => set("county", e.target.value)} style={inputS} />
          </Field>
          <Field label="Posts">
            <input type="number" value={form.posts}
              onChange={e => set("posts", parseInt(e.target.value) || 1)} style={inputS} min={1} />
          </Field>
          <Field label="Deadline" required>
            <input type="date" value={form.deadline}
              onChange={e => set("deadline", e.target.value)} style={inputS} />
          </Field>
          <Field label="Date Added">
            <input type="date" value={form.addedDate || ""}
              onChange={e => set("addedDate", e.target.value)} style={inputS} />
          </Field>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 16px" }}>
          <Field label="Status">
            <select value={form.status || "draft"}
              onChange={e => set("status", e.target.value)} style={selS}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </Field>
          <Field label="Chapter Six">
            <select value={form.chapterSix ? "yes" : "no"}
              onChange={e => set("chapterSix", e.target.value === "yes")} style={selS}>
              <option value="yes">Required</option>
              <option value="no">Not required</option>
            </select>
          </Field>
          <Field label="Education (display)">
            <select value={form.edu}
              onChange={e => set("edu", e.target.value)} style={selS}>
              {EDU_LEVELS.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Flag" hint="Triggers Needs Review — describe what needs checking">
          <textarea value={form.flag || ""}
            onChange={e => set("flag", e.target.value)}
            rows={5}
            style={{...inputS, resize:"vertical", minHeight:100}} />
        </Field>
      </div>

      <div style={{
        background:P.surface2, borderRadius:12, padding:"20px 20px 4px",
        marginBottom:16, border:`1px solid ${P.border}`
      }}>
        <h3 style={{
          fontSize:12, fontWeight:700, color:P.accent,
          textTransform:"uppercase", letterSpacing:".06em", marginBottom:16
        }}>Content</h3>
        <Field label="About">
          <textarea value={form.about}
            onChange={e => set("about", e.target.value)}
            style={{ ...inputS, minHeight:80, resize:"vertical" }} />
        </Field>
        <Field label="AI Summary">
          <textarea value={form.ai_summary}
            onChange={e => set("ai_summary", e.target.value)}
            style={{ ...inputS, minHeight:80, resize:"vertical" }} />
        </Field>
        <Field label="How to Apply">
          <textarea value={form.howToApply}
            onChange={e => set("howToApply", e.target.value)}
            style={{ ...inputS, minHeight:50, resize:"vertical" }} />
        </Field>
        <Field label="Responsibilities">
          <ListEditor
            value={form.responsibilities?.length ? form.responsibilities : [""]}
            onChange={v => set("responsibilities", v)} />
        </Field>
        <Field label="Requirements">
          <ListEditor
            value={form.requirements?.length ? form.requirements : [""]}
            onChange={v => set("requirements", v)} />
        </Field>
      </div>

      <div style={{
        background:P.surface2, borderRadius:12, padding:"20px 20px 4px",
        marginBottom:16, border:`1px solid ${P.border}`
      }}>
        <h3 style={{
          fontSize:12, fontWeight:700, color:P.accent,
          textTransform:"uppercase", letterSpacing:".06em", marginBottom:4
        }}>Match Engine Fields</h3>
        <p style={{ fontSize:11, color:P.text3, marginBottom:16 }}>
          Powers the scoring engine.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Education minimum">
            <select value={mf.edu_min || "Degree"}
              onChange={e => setMatch("edu_min", e.target.value)}
              style={{ ...inputS, cursor:"pointer" }}>
              {EDU_LEVELS.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Leadership course">
            <select value={mf.leadership_course ? "yes" : "no"}
              onChange={e => setMatch("leadership_course", e.target.value === "yes")}
              style={{ ...inputS, cursor:"pointer" }}>
              <option value="no">No</option>
              <option value="yes">Yes (4+ weeks)</option>
            </select>
          </Field>
        </div>

        <Field label={mf.edu_min === "PhD" ? "PhD field(s) of study" : mf.edu_min === "Masters" ? "Masters field(s) of study" : "Accepted degree fields"}
          hint={mf.edu_min === "Masters" || mf.edu_min === "PhD" 
            ? "Leave empty if advert says 'relevant field' or 'business-related field' — the engine will accept any field at this level" 
            : undefined}>
          <TagInput value={mf.edu_fields || []}
            onChange={v => setMatch("edu_fields", v)} options={FIELD_PILLS} />
          {(mf.edu_min === "Masters" || mf.edu_min === "PhD") && (mf.edu_fields || []).length === 0 && (
            <div style={{ fontSize:11, color:P.blue, marginTop:4, fontStyle:"italic" }}>
              Empty = any {mf.edu_min} field accepted ("relevant field")
              {(mf.edu_fields_bachelors || []).length > 0 && " — Bachelors fields are set below"}
            </div>
          )}
        </Field>

        {(mf.edu_min === "Masters" || mf.edu_min === "PhD") && (
          <Field label={"Bachelors field(s) of study" + ((mf.edu_fields_bachelors || []).length > 0 ? " ✓" : "")}
            hint="Set when advert names specific Bachelors fields (e.g. 'Bachelor's in Finance, Accounting, Commerce'). Leave empty if same fields as above or not specified.">
            <TagInput value={mf.edu_fields_bachelors || []}
              onChange={v => setMatch("edu_fields_bachelors", v.length > 0 ? v : null)} options={FIELD_PILLS} />
            {(mf.edu_fields_bachelors || []).length > 0 && (mf.edu_fields || []).length === 0 && (
              <div style={{ fontSize:11, color:P.green, marginTop:4, fontWeight:600 }}>
                ✓ Bachelors fields set — engine will check these even though {mf.edu_min} fields are empty
              </div>
            )}
          </Field>
        )}

        {mf.edu_min === "PhD" && (
          <Field label={"Masters field(s) of study" + ((mf.edu_fields_masters || []).length > 0 ? " ✓" : "")}
            hint="Set ONLY if advert names specific Masters fields different from PhD fields. Leave empty if same or not specified.">
            <TagInput value={mf.edu_fields_masters || []}
              onChange={v => setMatch("edu_fields_masters", v.length > 0 ? v : null)} options={FIELD_PILLS} />
          </Field>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
          <Field label="Years of experience">
            <input type="number" value={mf.years_experience || 0}
              onChange={e => setMatch("years_experience", parseInt(e.target.value) || 0)}
              style={inputS} min={0} max={30} />
          </Field>
          <Field label="Years in management"
            hint={mf.years_management > (mf.years_experience || 0) ?
              "⚠ Cannot exceed total experience" : undefined}>
            <input type="number" value={mf.years_management || 0}
              onChange={e => {
                const v = parseInt(e.target.value) || 0
                setMatch("years_management", Math.min(v, mf.years_experience || 99))
              }}
              style={inputS} min={0} max={mf.years_experience || 30} />
          </Field>
        </div>

        <Field label="Professional qualifications (required — ALL mandatory)">
          <CheckGroup value={mf.prof_quals_required || []}
            onChange={v => setMatch("prof_quals_required", v)} options={PROF_QUALS} />
        </Field>
        <Field label="Professional qualifications (OR groups — one from each group)"
          hint='Each group: tick quals that are alternatives. Click "Add OR group" for each set of alternatives.'>
          {(mf.prof_quals_required_groups || []).map((group, gi) => (
            <div key={gi} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6, padding:"6px 8px", background:P.surface2, borderRadius:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:P.blue, minWidth:50 }}>Group {gi+1}</span>
              <div style={{ flex:1 }}>
                <CheckGroup value={group} onChange={v => {
                  const groups = [...(mf.prof_quals_required_groups || [])];
                  groups[gi] = v;
                  setMatch("prof_quals_required_groups", groups.filter(g => g.length > 0));
                }} options={PROF_QUALS} />
              </div>
              <button onClick={() => {
                const groups = (mf.prof_quals_required_groups || []).filter((_, i) => i !== gi);
                setMatch("prof_quals_required_groups", groups);
              }} style={{ background:"none", border:"none", cursor:"pointer", color:P.red, fontSize:16, padding:4 }}>✕</button>
            </div>
          ))}
          <button onClick={() => setMatch("prof_quals_required_groups", [...(mf.prof_quals_required_groups || []), []])}
            style={{ fontSize:11, fontWeight:600, color:P.blue, background:"none", border:`1px dashed ${P.blue}40`, borderRadius:6, padding:"4px 10px", cursor:"pointer", marginTop:4 }}>+ Add OR group</button>
        </Field>
        <Field label="Professional qualifications (preferred)">
          <CheckGroup value={mf.prof_quals_preferred || []}
            onChange={v => setMatch("prof_quals_preferred", v)} options={PROF_QUALS} />
        </Field>
        <Field label="Professional bodies (required — ALL mandatory)">
          <CheckGroup value={mf.prof_bodies_required || []}
            onChange={v => setMatch("prof_bodies_required", v)} options={PROF_BODIES} />
        </Field>
        <Field label="Professional bodies (OR groups — one from each group)"
          hint='Each group: tick bodies that are alternatives.'>
          {(mf.prof_bodies_required_groups || []).map((group, gi) => (
            <div key={gi} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6, padding:"6px 8px", background:P.surface2, borderRadius:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:P.blue, minWidth:50 }}>Group {gi+1}</span>
              <div style={{ flex:1 }}>
                <CheckGroup value={group} onChange={v => {
                  const groups = [...(mf.prof_bodies_required_groups || [])];
                  groups[gi] = v;
                  setMatch("prof_bodies_required_groups", groups.filter(g => g.length > 0));
                }} options={PROF_BODIES} />
              </div>
              <button onClick={() => {
                const groups = (mf.prof_bodies_required_groups || []).filter((_, i) => i !== gi);
                setMatch("prof_bodies_required_groups", groups);
              }} style={{ background:"none", border:"none", cursor:"pointer", color:P.red, fontSize:16, padding:4 }}>✕</button>
            </div>
          ))}
          <button onClick={() => setMatch("prof_bodies_required_groups", [...(mf.prof_bodies_required_groups || []), []])}
            style={{ fontSize:11, fontWeight:600, color:P.blue, background:"none", border:`1px dashed ${P.blue}40`, borderRadius:6, padding:"4px 10px", cursor:"pointer", marginTop:4 }}>+ Add OR group</button>
        </Field>
        <Field label="Professional bodies (preferred)">
          <CheckGroup value={mf.prof_bodies_preferred || []}
            onChange={v => setMatch("prof_bodies_preferred", v)} options={PROF_BODIES} />
        </Field>
        <Field label="Key skills">
          <TagInput value={mf.key_skills || []}
            onChange={v => setMatch("key_skills", v)} options={[]} />
        </Field>
        <Field label="Special requirements">
          <TagInput value={mf.special_requirements || []}
            onChange={v => setMatch("special_requirements", v)} options={[]} />
        </Field>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, paddingBottom:32 }}>
        <button onClick={onCancel}
          style={btn(P.surface, P.text2, `1px solid ${P.border}`)}>Cancel</button>
        <button onClick={handleSave}
          style={{ ...btn(P.green, "#fff"), fontWeight:700, padding:"10px 24px" }}>
          Save Job
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("list")
  const [editJob, setEditJob] = useState(null)
  const [q, setQ] = useState("")
  const [sectorFilter, setSectorFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("all")
  const [eduFilter, setEduFilter] = useState("All")
  const [sortCol, setSortCol] = useState("deadline")
  const [sortDir, setSortDir] = useState("desc")
  const [showEmployers, setShowEmployers] = useState(false)
  const [showClosingSoon, setShowClosingSoon] = useState(false)
  const [showUnenriched, setShowUnenriched] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [importData, setImportData] = useState(null)

  // Load from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .order('added_date', { ascending: false })
        if (error) throw error
        const mapped = (data || []).map(j => ({
          id: j.display_id,
          _supabase_id: j.id,
          src: j.source,
          isNew: j.is_new,
          open: j.status === 'published',
          status: j.status,
          deadline: j.deadline,
          addedDate: j.added_date,
          title: j.title,
          employer: j.employer,
          sector: j.sector,
          county: j.county,
          edu: j.edu_min,
          posts: j.posts,
          grade: j.grade || '',
          ref: j.ref || '',
          flag: j.flag || '',
          about: j.about,
          responsibilities: j.responsibilities || [],
          requirements: j.requirements || [],
          howToApply: j.how_to_apply,
          chapterSix: j.chapter_six,
          ai_summary: j.ai_summary || '',
          ai_match_fields: j.ai_match_fields || {},
        }))
        setJobs(mapped)
      } catch (err) {
        console.error('[Admin] Failed to load jobs:', err)
      }
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    const today = new Date()
    let changed = false
    const updated = jobs.map(j => {
      if (j.isNew && j.addedDate && (today - new Date(j.addedDate)) / 864e5 > 14) {
        changed = true
        return { ...j, isNew: false }
      }
      return j
    })
    if (changed) setJobs(updated)
  }, [])

  const now = new Date()
  const isOpen = useCallback(
    j => (j.status === "published" || (j.status === undefined && j.open)) && new Date(j.deadline + "T17:00:00+03:00") > now, []
  )
  const isDeg = j => (EDU_RANK[j.edu] || 0) >= EDU_RANK["Degree"]
  // hasEmpty: flag as unenriched only if edu_fields is empty AND job has an unresolved flag
  // Empty edu_fields with no flag = intentional open field (e.g. CEO roles, "any field accepted")
  // Empty edu_fields with a flag = genuinely missing, needs admin attention
  const hasEmpty = j => isOpen(j) && isDeg(j) &&
    (!j.ai_match_fields?.edu_fields || j.ai_match_fields.edu_fields.length === 0) &&
    (!j.ai_match_fields?.edu_fields_bachelors || j.ai_match_fields.edu_fields_bachelors.length === 0) &&
    (j.flag && j.flag.trim())
  const isUnresolved = j => hasEmpty(j) || (j.flag && j.flag.trim())

  const stats = useMemo(() => {
    const op = jobs.filter(j => isOpen(j))
    const unresolved = jobs.filter(j => isUnresolved(j))
    const dp = op.filter(j => isDeg(j))
    const en = dp.filter(j => j.ai_match_fields?.edu_fields?.length > 0)
    const pct = dp.length > 0 ? Math.round(en.length / dp.length * 100) : 100
    return {
      total: jobs.length, open: jobs.filter(j => (j.status === "published" || (j.status === undefined && j.open)) && !isUnresolved(j)).length,
      draft: jobs.filter(j => j.status === "draft").length,
      unresolved: unresolved.length,
      closed: jobs.filter(j => (j.status === "unpublished" || (!j.status && !j.open)) && !isUnresolved(j)).length,
      employers: new Set(jobs.map(j => j.employer)).size,
      closingSoon: op.filter(j =>
        (new Date(j.deadline + "T17:00:00+03:00") - now) / 864e5 <= 7
      ).length,
      enrichedPct: pct,
      enrichedColor: pct >= 90 ? P.green : pct >= 70 ? P.amber : P.red,
    }
  }, [jobs])

  const reviewCount = useMemo(() =>
    jobs.filter(j => hasEmpty(j) || (j.flag && j.flag.trim())).length
  , [jobs])

  const filtered = useMemo(() => {
    let f = [...jobs]
    if (showClosingSoon) {
      f = f.filter(j =>
        isOpen(j) && (new Date(j.deadline + "T17:00:00+03:00") - now) / 864e5 <= 7
      )
    } else if (showUnenriched) {
      f = f.filter(j => hasEmpty(j))
    } else {
      if (q) {
        const ql = q.toLowerCase()
        f = f.filter(j =>
          (j.title + j.employer + j.id + (j.sector || "")).toLowerCase().includes(ql)
        )
      }
      if (sectorFilter !== "All") f = f.filter(j => j.sector === sectorFilter)
      if (statusFilter === "published") f = f.filter(j => (j.status === "published" || (j.status === undefined && j.open)) && !isUnresolved(j))
      if (statusFilter === "unresolved") f = f.filter(j => isUnresolved(j))
      if (statusFilter === "draft") f = f.filter(j => j.status === "draft")
      if (statusFilter === "unpublished") f = f.filter(j => (j.status === "unpublished" || (!j.status && !j.open)) && !isUnresolved(j))
      if (eduFilter !== "All") f = f.filter(j => j.edu === eduFilter)
    }
    f.sort((a, b) => {
      let va = a[sortCol] || "", vb = b[sortCol] || ""
      if (sortCol === "posts") { va = a.posts; vb = b.posts }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return f
  }, [jobs, q, sectorFilter, statusFilter, eduFilter, sortCol, sortDir,
      showClosingSoon, showUnenriched])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("asc") }
  }

  const saveJob = async (job) => {
    if (!job.id || !job.title || !job.employer || !job.deadline) {
      alert("Fill in: ID, Title, Employer, Deadline"); return
    }
    // Map admin job format to Supabase columns
    const row = {
      display_id: job.id,
      source: job.src || 'MyGov',
      is_new: job.isNew !== false,
      status: job.status || 'draft',
      deadline: job.deadline,
      added_date: job.addedDate || new Date().toISOString().split('T')[0],
      title: job.title,
      employer: job.employer,
      sector: job.sector || 'Other',
      county: job.county || 'Nairobi',
      edu_min: job.edu || 'Degree',
      posts: job.posts || 1,
      grade: job.grade || '',
      ref: job.ref || '',
      flag: job.flag || '',
      about: job.about || '',
      responsibilities: job.responsibilities || [],
      requirements: job.requirements || [],
      how_to_apply: job.howToApply || '',
      chapter_six: job.chapterSix !== false,
      ai_summary: job.ai_summary || '',
      ai_match_fields: job.ai_match_fields || {},
    }
    try {
      if (job._supabase_id) {
        // Update existing
        const { error } = await supabase.from('jobs').update(row).eq('id', job._supabase_id)
        if (error) throw error
      } else {
        // Insert new
        const { data, error } = await supabase.from('jobs').insert(row).select().single()
        if (error) throw error
        job._supabase_id = data.id
      }
      setJobs(prev => {
        const idx = prev.findIndex(j => j.id === job.id)
        if (idx >= 0) { const a = [...prev]; a[idx] = job; return a }
        return [...prev, job]
      })
      setView("list"); setEditJob(null)
    } catch (err) {
      alert('Failed to save job: ' + err.message)
    }
  }

  const deleteJob = async (id) => {
    const job = jobs.find(j => j.id === id)
    if (job?._supabase_id) {
      const { error } = await supabase.from('jobs').delete().eq('id', job._supabase_id)
      if (error) { alert('Failed to delete: ' + error.message); return }
    }
    setJobs(prev => prev.filter(j => j.id !== id))
    setView("list"); setEditJob(null)
  }

  const purgeAll = async () => {
    if (safeConfirm("Delete ALL jobs from the database? This cannot be undone.")) {
      const { error } = await supabase.from('jobs').delete().neq('id', 0)
      if (error) { alert('Failed to purge: ' + error.message); return }
      setJobs([]); setSelected(new Set())
    }
  }

  const exportJSON = (publishedOnly = false) => {
    const data = publishedOnly ? jobs.filter(j => j.status === "published") : jobs
    const fname = publishedOnly ? "jobs_published.json" : "jobs_all.json"
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = fname; a.click()
    URL.revokeObjectURL(url)
  }

  const startImport = () => {
    const inp = document.createElement("input")
    inp.type = "file"; inp.accept = ".json"
    inp.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          if (Array.isArray(data)) setImportData(data)
          else alert("Expected a JSON array.")
        } catch { alert("Failed to parse JSON.") }
      }
      reader.readAsText(file)
    }
    inp.click()
  }

  const toRow = (job) => ({
    display_id: job.id,
    source: job.src || 'MyGov',
    is_new: job.isNew !== false,
    status: job.status || 'draft',
    deadline: job.deadline,
    added_date: job.addedDate || new Date().toISOString().split('T')[0],
    title: job.title,
    employer: job.employer,
    sector: job.sector || 'Other',
    county: job.county || 'Nairobi',
    edu_min: job.edu || 'Degree',
    posts: job.posts || 1,
    grade: job.grade || '',
    ref: job.ref || '',
    flag: job.flag || '',
    about: job.about || '',
    responsibilities: job.responsibilities || [],
    requirements: job.requirements || [],
    how_to_apply: job.howToApply || '',
    chapter_six: job.chapterSix !== false,
    ai_summary: job.ai_summary || '',
    ai_match_fields: job.ai_match_fields || {},
  })

  const confirmImport = async (nw, up) => {
    try {
      // UPDATE existing jobs in Supabase
      for (const u of up) {
        if (u._supabase_id) {
          const { error } = await supabase.from('jobs').update(toRow(u)).eq('id', u._supabase_id)
          if (error) throw error
        }
      }

      // Auto-assign IDs to new jobs and INSERT into Supabase
      let maxNum = 0
      jobs.forEach(j => { const m = j.id?.match(/(\d+)$/); if (m) maxNum = Math.max(maxNum, parseInt(m[1])) })
      const reNw = nw.map((j, i) => ({ ...j, id: 'myg_' + String(maxNum + 1 + i).padStart(3, '0'), status: 'draft' }))

      const insertedNew = []
      for (const j of reNw) {
        const { data, error } = await supabase.from('jobs').insert(toRow(j)).select().single()
        if (error) throw error
        insertedNew.push({ ...j, _supabase_id: data.id })
      }

      // Update local state
      setJobs(prev => {
        let r = [...prev]
        up.forEach(u => { const i = r.findIndex(j => j.id === u.id); if (i >= 0) r[i] = u })
        return [...r, ...insertedNew]
      })
      setImportData(null)
    } catch (err) {
      alert('Import failed: ' + err.message)
    }
  }

  const nextId = useMemo(() => {
    const nums = jobs.map(j => {
      const m = j.id?.match(/(\d+)$/)
      return m ? parseInt(m[1]) : 0
    })
    return `myg_${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`
  }, [jobs])

  const sortIcon = (col) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""
  const toggleSel = (id) => setSelected(p => {
    const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s
  })
  const toggleAll = () => {
    const ids = filtered.map(j => j.id)
    setSelected(ids.every(id => selected.has(id)) ? new Set() : new Set(ids))
  }
  const bulkClose = () => {
    setJobs(p => p.map(j => selected.has(j.id) ? { ...j, status:"unpublished" } : j))
    setSelected(new Set())
  }
  const bulkPublish = () => {
    setJobs(p => p.map(j => selected.has(j.id) ? { ...j, status:"published" } : j))
    setSelected(new Set())
  }
  const bulkUnNew = () => {
    setJobs(p => p.map(j => selected.has(j.id) ? { ...j, isNew:false } : j))
    setSelected(new Set())
  }
  const bulkDel = () => {
    if (safeConfirm(`Delete ${selected.size} jobs?`)) {
      setJobs(p => p.filter(j => !selected.has(j.id)))
      setSelected(new Set())
    }
  }
  const clearFilters = () => {
    setShowClosingSoon(false); setShowUnenriched(false)
    setQ(""); setSectorFilter("All"); setStatusFilter("all"); setEduFilter("All")
  }

  const cssBlock = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    input:focus,select:focus,textarea:focus{border-color:${P.blue}!important;box-shadow:0 0 0 2px ${P.blueSoft}!important}
    ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${P.border};border-radius:3px}
    table tr:hover td{background:${P.surface2}!important}th{cursor:pointer;user-select:none}th:hover{color:${P.text}!important}`

  if (view === "edit" || view === "add") {
    return (
      <div style={{
        height:"100vh", background:P.bg,
        fontFamily:'"DM Sans",system-ui,sans-serif', color:P.text, overflow:"hidden"
      }}>
        <style>{cssBlock}</style>
        <JobEditor
          job={view === "add" ? {
            ...JSON.parse(JSON.stringify(EMPTY_JOB)),
            id: nextId,
            addedDate: new Date().toISOString().split("T")[0]
          } : editJob}
          onSave={saveJob}
          onCancel={() => { setView("list"); setEditJob(null) }}
          onDelete={view === "edit" ? () => deleteJob(editJob.id) : null}
          isNew={view === "add"}
          existingJobs={jobs}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:P.bg, fontFamily:'"DM Sans",system-ui,sans-serif' }}>
        <div style={{ textAlign:"center", color:P.text3 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>⚙️</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Loading jobs...</div>
        </div>
      </div>
    )
  }

  if (view === "review") {
    const ef = jobs.filter(j => hasEmpty(j))
    const fl = jobs.filter(j => j.flag && j.flag.trim() && !hasEmpty(j))
    return (
      <div style={{
        height:"100vh", display:"flex", flexDirection:"column", background:P.bg,
        fontFamily:'"DM Sans",system-ui,sans-serif', color:P.text, overflow:"hidden"
      }}>
        <style>{cssBlock}</style>
        <div style={{
          padding:"16px 24px", borderBottom:`1px solid ${P.border}`,
          display:"flex", alignItems:"center", gap:12
        }}>
          <button onClick={() => setView("list")}
            style={{ ...btn(P.surface, P.text2, `1px solid ${P.border}`), fontSize:13 }}>
            ← Back
          </button>
          <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>Needs Review</h2>
          <span style={{
            fontSize:11, fontWeight:700, color:P.red, background:P.redSoft,
            padding:"3px 8px", borderRadius:6
          }}>{ef.length + fl.length}</span>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {ef.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{
                fontSize:11, fontWeight:700, color:P.amber,
                textTransform:"uppercase", marginBottom:10
              }}>Missing edu_fields ({ef.length})</div>
              {ef.map(j => (
                <div key={j.id} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 14px", background:P.surface,
                  border:`1px solid ${P.border}`, borderRadius:8, marginBottom:6
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:P.text }}>{j.title}</div>
                    <div style={{ fontSize:11, color:P.text3 }}>
                      {j.employer?.split("(")[0].trim()} · {j.edu} · {j.deadline}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => { setEditJob(j); setView("edit") }}
                      style={btn(P.blueSoft, P.blue, `1px solid ${P.blue}30`)}>Resolve</button>
                    <button onClick={() => deleteJob(j.id)}
                      style={btn(P.redSoft, P.red, `1px solid ${P.red}30`)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {fl.length > 0 && (
            <div>
              <div style={{
                fontSize:11, fontWeight:700, color:P.red,
                textTransform:"uppercase", marginBottom:10
              }}>Flagged ({fl.length})</div>
              {fl.map(j => (
                <div key={j.id} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 14px", background:P.surface,
                  border:`1px solid ${P.border}`, borderRadius:8, marginBottom:6
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:P.text }}>{j.title}</div>
                    <div style={{ fontSize:11, color:P.text3 }}>
                      Flag: <span style={{ color:P.amber }}>{j.flag}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => { setEditJob(j); setView("edit") }}
                      style={btn(P.blueSoft, P.blue, `1px solid ${P.blue}30`)}>Resolve</button>
                    <button onClick={() => deleteJob(j.id)}
                      style={btn(P.redSoft, P.red, `1px solid ${P.red}30`)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {ef.length === 0 && fl.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:P.text3 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✓</div>
              <p style={{ fontSize:14, fontWeight:600 }}>All clear</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const cols = [
    { k:"id", l:"ID", w:70 }, { k:"title", l:"Title" },
    { k:"employer", l:"Employer", w:200 }, { k:"sector", l:"Sector", w:85 },
    { k:"edu", l:"Edu", w:60 }, { k:"posts", l:"#", w:30 },
    { k:"deadline", l:"Deadline", w:85 }, { k:"addedDate", l:"Added", w:85 },
    { k:"status", l:"Status", w:60 },
  ]

  const statCards = [
    { label:"Total", value:stats.total, color:P.text, click:clearFilters },
    { label:"Published", value:stats.open, color:P.green,
      click:() => { clearFilters(); setStatusFilter("published") }},
    { label:"Draft", value:stats.draft, color:P.blue,
      click:() => { clearFilters(); setStatusFilter("draft") }},
    { label:"Unresolved", value:stats.unresolved, color:P.amber,
      click:() => { clearFilters(); setStatusFilter("unresolved") }},
    { label:"Unpublished", value:stats.closed, color:P.text3,
      click:() => { clearFilters(); setStatusFilter("unpublished") }},
    { label:"Employers", value:stats.employers, color:P.blue,
      click:() => setShowEmployers(p => !p) },
    { label:"≤7 days", value:stats.closingSoon, color:P.amber,
      click:() => { setShowEmployers(false); setShowUnenriched(false);
        setShowClosingSoon(p => !p) }},
    { label:"Enriched", value:stats.enrichedPct + "%", color:stats.enrichedColor,
      click:() => { setShowEmployers(false); setShowClosingSoon(false);
        setShowUnenriched(p => !p) }},
  ]

  const isCardActive = (label) => {
    if (showClosingSoon && label === "≤7 days") return true
    if (showUnenriched && label === "Enriched") return true
    if (showEmployers && label === "Employers") return true
    return false
  }

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column", background:P.bg,
      fontFamily:'"DM Sans",system-ui,sans-serif', color:P.text, overflow:"hidden"
    }}>
      <style>{cssBlock}</style>

      {importData && (
        <ImportPreview incoming={importData} existing={jobs}
          onConfirm={confirmImport} onCancel={() => setImportData(null)} />
      )}

      <div style={{
        padding:"14px 24px", borderBottom:`1px solid ${P.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div onClick={clearFilters} style={{
            fontSize:20, fontWeight:800, letterSpacing:"-.02em", cursor:"pointer"
          }}>
            <span style={{ color:P.text }}>Gava</span>
            <span style={{ color:P.accent }}>Jobs</span>
            <span style={{
              fontSize:11, fontWeight:600, color:P.text3, marginLeft:8,
              textTransform:"uppercase", letterSpacing:".06em"
            }}>Admin</span>
          </div>
          <button onClick={() => setView("review")} style={{
            ...btn(
              reviewCount > 0 ? P.redSoft : P.surface,
              reviewCount > 0 ? P.red : P.text3,
              `1px solid ${reviewCount > 0 ? P.red + "30" : P.border}`
            ),
            display:"flex", alignItems:"center", gap:5
          }}>
            Needs Review
            {reviewCount > 0 && (
              <span style={{
                fontSize:10, fontWeight:700, background:P.red, color:"#fff",
                padding:"1px 6px", borderRadius:8
              }}>{reviewCount}</span>
            )}
          </button>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {jobs.length > 0 && (
            <button onClick={purgeAll}
              style={btn(P.redSoft, P.red, `1px solid ${P.red}30`)}>✕ Purge</button>
          )}
          <button onClick={startImport}
            style={btn(P.surface2, P.text2, `1px solid ${P.border}`)}>↑ Import</button>
          <button onClick={() => exportJSON(false)}
            style={btn(P.surface2, P.text2, `1px solid ${P.border}`)}>↓ Export All</button>
          <button onClick={() => exportJSON(true)}
            style={btn(P.greenSoft, P.green, `1px solid ${P.green}30`)}>↓ Published</button>
          <button onClick={() => setView("add")} style={{
            ...btn(P.green, "#fff"), fontWeight:700, padding:"8px 16px"
          }}>+ Add Job</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, padding:"14px 24px", flexShrink:0 }}>
        {statCards.map(s => (
          <div key={s.label} onClick={s.click} style={{
            flex:1, padding:"10px 14px", cursor:"pointer", transition:"all .15s",
            borderRadius:10,
            background:isCardActive(s.label) ? P.blueSoft : P.surface,
            border:`1px solid ${isCardActive(s.label) ? P.blue : P.border}`,
          }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{
              fontSize:9, fontWeight:600, color:P.text3,
              textTransform:"uppercase", letterSpacing:".05em"
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(showClosingSoon || showUnenriched) && (
        <div style={{ padding:"0 24px 8px" }}>
          <span style={{
            fontSize:12, fontWeight:600, color:P.amber, background:P.amberSoft,
            padding:"4px 10px", borderRadius:6, display:"inline-flex",
            alignItems:"center", gap:6
          }}>
            {showClosingSoon
              ? `${stats.closingSoon} jobs closing within 7 days`
              : "Open Degree+ jobs with empty edu_fields"}
            <button onClick={clearFilters} style={{
              background:"none", border:"none", color:P.amber,
              cursor:"pointer", fontSize:14, padding:0
            }}>×</button>
          </span>
        </div>
      )}

      {showEmployers && (() => {
        const ed = {}
        jobs.forEach(j => {
          const n = j.employer || "?"
          if (!ed[n]) ed[n] = { t:0, o:0 }
          ed[n].t++
          if (isOpen(j)) ed[n].o++
        })
        return (
          <div style={{
            margin:"0 24px 10px", background:P.surface,
            border:`1px solid ${P.border}`, borderRadius:10,
            maxHeight:240, overflowY:"auto", padding:"4px 0"
          }}>
            {Object.entries(ed).sort((a,b) => b[1].t - a[1].t).map(([n, d]) => (
              <div key={n}
                onClick={() => {
                  setQ(n.split("(")[0].trim().slice(0,20))
                  setShowEmployers(false)
                }}
                style={{
                  display:"flex", justifyContent:"space-between",
                  padding:"7px 16px", cursor:"pointer",
                  borderBottom:`1px solid ${P.border}08`
                }}
                onMouseEnter={e => e.currentTarget.style.background = P.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{
                  fontSize:12, color:P.text, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:12
                }}>{n}</span>
                <div style={{ display:"flex", gap:16 }}>
                  <span style={{
                    fontSize:12, fontWeight:600, width:36, textAlign:"right",
                    color:d.o > 0 ? P.green : P.text3
                  }}>{d.o}</span>
                  <span style={{
                    fontSize:12, color:P.text2, width:36, textAlign:"right"
                  }}>{d.t}</span>
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {!showClosingSoon && !showUnenriched && (
        <div style={{
          display:"flex", gap:8, padding:"0 24px 10px",
          alignItems:"center", flexShrink:0, flexWrap:"wrap"
        }}>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search..."
            style={{
              flex:1, fontFamily:"inherit", fontSize:13, padding:"7px 12px",
              borderRadius:8, border:`1px solid ${P.border}`, background:P.surface,
              color:P.text, outline:"none", maxWidth:280, minWidth:120
            }} />
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
            style={{
              fontFamily:"inherit", fontSize:12, padding:"7px 8px", borderRadius:8,
              border:`1px solid ${P.border}`, background:P.surface,
              color:P.text2, cursor:"pointer", outline:"none"
            }}>
            <option value="All">All sectors</option>
            {[...new Set([...SECTORS, ...jobs.map(j => j.sector).filter(Boolean)])]
              .sort().map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{
              fontFamily:"inherit", fontSize:12, padding:"7px 8px", borderRadius:8,
              border:`1px solid ${P.border}`, background:P.surface,
              color:P.text2, cursor:"pointer", outline:"none"
            }}>
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="unresolved">Unresolved</option>
            <option value="unpublished">Unpublished</option>
          </select>
          <select value={eduFilter} onChange={e => setEduFilter(e.target.value)}
            style={{
              fontFamily:"inherit", fontSize:12, padding:"7px 8px", borderRadius:8,
              border:`1px solid ${P.border}`, background:P.surface,
              color:P.text2, cursor:"pointer", outline:"none"
            }}>
            <option value="All">All levels</option>
            {EDU_LEVELS.map(e => <option key={e}>{e}</option>)}
          </select>
          <span style={{ fontSize:12, color:P.text3 }}>{filtered.length} jobs</span>
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto", padding:"0 24px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:P.text3 }}>
            {jobs.length === 0 ? (
              <>
                <div style={{ fontSize:40, marginBottom:12, opacity:.4 }}>📋</div>
                <p style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No jobs yet</p>
                <p style={{ fontSize:13, marginBottom:20 }}>
                  Import a JSON file or add jobs manually.
                </p>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  <button onClick={startImport}
                    style={btn(P.surface2, P.text2, `1px solid ${P.border}`)}>
                    ↑ Import JSON
                  </button>
                  <button onClick={() => setView("add")}
                    style={{ ...btn(P.green, "#fff"), fontWeight:700 }}>
                    + Add First Job
                  </button>
                </div>
              </>
            ) : (
              <p style={{ fontSize:14 }}>No jobs match your filters.</p>
            )}
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, fontSize:13 }}>
            <thead>
              <tr>
                <th style={{
                  padding:"10px 6px", borderBottom:`2px solid ${P.border}`,
                  position:"sticky", top:0, background:P.bg, zIndex:1, width:30
                }}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && filtered.every(j => selected.has(j.id))}
                    onChange={toggleAll}
                    style={{ cursor:"pointer", accentColor:P.blue }} />
                </th>
                {cols.map(c => (
                  <th key={c.k} onClick={() => handleSort(c.k)} style={{
                    textAlign:"left", padding:"10px 6px", fontSize:10, fontWeight:700,
                    color:P.text3, textTransform:"uppercase", letterSpacing:".04em",
                    borderBottom:`2px solid ${P.border}`, whiteSpace:"nowrap",
                    width:c.w || "auto", position:"sticky", top:0, background:P.bg, zIndex:1
                  }}>
                    {c.l}{sortIcon(c.k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => {
                const editClick = () => { setEditJob(j); setView("edit") }
                const tdS = {
                  padding:"8px 6px", borderBottom:`1px solid ${P.border}`, cursor:"pointer"
                }
                return (
                  <tr key={j.id}>
                    <td style={{ ...tdS, cursor:"default" }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(j.id)}
                        onChange={() => toggleSel(j.id)}
                        style={{ cursor:"pointer", accentColor:P.blue }} />
                    </td>
                    <td onClick={editClick} style={{
                      ...tdS, color:P.text3, fontFamily:"monospace", fontSize:11
                    }}>{j.id}</td>
                    <td onClick={editClick} style={{
                      ...tdS, fontWeight:600, color:P.text, maxWidth:260,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
                    }}>
                      {j.title}
                      {j.flag && (
                        <span style={{
                          marginLeft:6, fontSize:9, fontWeight:700, color:P.red,
                          background:P.redSoft, padding:"1px 5px", borderRadius:4
                        }}>!</span>
                      )}
                    </td>
                    <td onClick={editClick} style={{
                      ...tdS, color:P.text2, maxWidth:200, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:12
                    }}>{j.employer?.split("(")[0].trim()}</td>
                    <td onClick={editClick} style={{
                      ...tdS, color:P.text3, fontSize:11
                    }}>{j.sector}</td>
                    <td onClick={editClick} style={{
                      ...tdS, color:P.text3, fontSize:11
                    }}>{j.edu}</td>
                    <td onClick={editClick} style={{
                      ...tdS, textAlign:"center", fontSize:12,
                      color:j.posts >= 10 ? P.blue : P.text3,
                      fontWeight:j.posts >= 10 ? 700 : 400
                    }}>{j.posts}</td>
                    <td onClick={editClick} style={{
                      ...tdS, fontSize:11, color:P.text2, whiteSpace:"nowrap"
                    }}>{j.deadline}</td>
                    <td onClick={editClick} style={{
                      ...tdS, fontSize:11, color:P.text3, whiteSpace:"nowrap"
                    }}>{j.addedDate || "—"}</td>
                    <td onClick={editClick} style={tdS}>
                      <StatusPill status={j.status || (j.open ? "published" : "unpublished")} deadline={j.deadline} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected.size > 0 && (
        <div style={{
          position:"sticky", bottom:0, padding:"12px 24px", background:P.surface2,
          borderTop:`1px solid ${P.border}`, display:"flex",
          alignItems:"center", justifyContent:"space-between", zIndex:5
        }}>
          <span style={{ fontSize:13, fontWeight:600, color:P.text }}>
            {selected.size} selected
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={bulkPublish}
              style={btn(P.greenSoft, P.green, `1px solid ${P.green}30`)}>
              Publish selected
            </button>
            <button onClick={bulkClose}
              style={btn(P.amberSoft, P.amber, `1px solid ${P.amber}30`)}>
              Unpublish selected
            </button>
            <button onClick={bulkUnNew}
              style={btn(P.surface, P.text2, `1px solid ${P.border}`)}>
              Mark not new
            </button>
            <button onClick={bulkDel}
              style={btn(P.redSoft, P.red, `1px solid ${P.red}30`)}>
              Delete selected
            </button>
            <button onClick={() => setSelected(new Set())}
              style={btn(P.surface, P.text3, `1px solid ${P.border}`)}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
