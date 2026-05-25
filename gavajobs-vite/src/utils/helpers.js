import { C } from '../constants/theme'

// Score → color mapping
export function matchColor(score) {
  if (score >= 70) return C.green
  if (score >= 40) return C.amber
  if (score === 0) return C.red
  return C.text3
}


// Score → label mapping (Excellent, Good, etc.)
export function matchLabel(score) {
  if (score >= 70) return "Strong match"
  if (score >= 40) return "Partial match"
  if (score === 0) return "Not a match"
  return "Low match"
}

// ─── UTILITIES ───────────────────────────────────────────────

// Deadline → display string
export function dl(d) {
  const deadlineTime = new Date(d+"T17:00:00+03:00")
  const now = new Date()
  if (now > deadlineTime) return { text:"Closed", color:C.text3, closed:true, urgent:false, daysLeft:-1 }
  // Use calendar date comparison: deadline date vs today's date in EAT
  const todayStr = new Date(now.getTime() + 3*3600000).toISOString().split("T")[0]
  const isToday = d === todayStr
  const isTomorrow = (() => {
    const tom = new Date(now.getTime() + 3*3600000 + 864e5)
    return d === tom.toISOString().split("T")[0]
  })()
  const diff = Math.ceil((deadlineTime - now) / 864e5)
  if (isToday) return { text:"Closes today", color:C.red, closed:false, urgent:true, daysLeft:0 }
  if (isTomorrow) return { text:"Closes tomorrow", color:C.red, closed:false, urgent:true, daysLeft:1 }
  if (diff <= 3) return { text:`${diff} days left`, color:C.red, closed:false, urgent:true, daysLeft:diff }
  if (diff <= 7) return { text:`${diff} days left`, color:C.amber, closed:false, urgent:false, daysLeft:diff }
  return { text:`${diff} days left`, color:C.text2, closed:false, urgent:false, daysLeft:diff }
}


// Initials from employer name
export function ini(s) { return (s.match(/\b[A-Z]/g)||[s[0]]).slice(0,2).join("") }


// WhatsApp share URL builder
export function waShare(job) {
  const t = `${job.title} at ${job.employer} · ${job.county}\nDeadline: ${job.deadline}\nSee match score & details on GavaJobs`
  if (navigator.share) {
    navigator.share({ title: job.title, text: t }).catch(() => {})
  } else {
    try { navigator.clipboard.writeText(t) } catch {}
  }
}

// ─── LOCAL STORAGE HELPERS ───────────────────────────────────
