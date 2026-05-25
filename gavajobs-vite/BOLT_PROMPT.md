# GavaJobs — Complete Bolt Integration Prompt

Copy everything below this line and paste into Bolt when you upload the project.

---

## PROMPT FOR BOLT:

This is GavaJobs — a Kenya government job matching portal built as a Vite React project. It helps Kenyan job seekers find government vacancies they qualify for by scoring them 0-95% against job requirements.

### WHAT THIS PROJECT IS

**Public frontend** (src/App.jsx): Job seekers browse 280+ government vacancies, build a profile (education, qualifications, experience), and see personalised match scores with a requirement-by-requirement checklist showing which requirements they meet and which they don't.

**Admin panel** (src/pages/Admin.jsx): The site operator imports new jobs from JSON, reviews them, and publishes individually. Accessed at /#/admin. Must be password-protected — only users in the admin_users database table can access it.

**Matching engine** (src/services/matchingEngine.js): A 385-line scoring algorithm that compares candidate profiles against job requirements across 7 dimensions (education level, field of study, professional qualifications, professional body membership, years of experience, management experience, leadership course). Max score 95%. This currently runs in the browser but must eventually run server-side only to protect IP. For now, keep it client-side.

**All job data** is in src/constants/jobs.js (280 jobs from 80+ Kenyan government employers). After Supabase is connected, this data should be seeded into the jobs table and the frontend should fetch from the database instead of this file.

### WHAT I NEED YOU TO DO

**Read SECURITY.md before making any changes.** It contains mandatory security rules.

1. **Connect to Supabase.** My Supabase project URL and anon key are:
   - URL: [PASTE YOUR URL HERE]
   - Anon key: [PASTE YOUR ANON KEY HERE]

2. **Run the database migration.** Execute the SQL in `supabase/migrations/001_initial_schema.sql`. This creates all 6 tables with Row Level Security enabled and all policies pre-written. Do NOT modify the RLS policies.

3. **Uncomment and configure the Supabase client** in `src/services/supabase.js`. Use only the anon key. Never use the service role key in frontend code.

4. **Replace localStorage with Supabase queries** in the storage layer. The file `src/services/storage.js` has async functions with TODO comments showing the exact Supabase replacement for each function. Swap them:
   - getProfile() → supabase.from('profiles').select().eq('user_id', userId).single()
   - saveProfile() → supabase.from('profiles').upsert(profile)
   - getSavedJobs() → supabase.from('saved_jobs').select().eq('user_id', userId)
   - etc.

5. **Connect authentication.** The AuthScreen component (src/components/AuthScreen.jsx) has a placeholder localStorage auth. Replace with:
   - Email/password: supabase.auth.signUp() and supabase.auth.signInWithPassword()
   - Google OAuth: supabase.auth.signInWithOAuth({ provider: 'google' })
   - The "Continue with Google" button already exists in the UI

6. **Set up Google OAuth** in Supabase dashboard → Authentication → Providers → Google. The AuthScreen already has the Google button — just connect it.

7. **Protect the admin route.** When a user navigates to /#/admin, check if they are in the admin_users table. If not, redirect to the main app. The is_admin() database function already exists in the migration.

8. **Seed the job data.** Import the 280 jobs from src/constants/jobs.js into the jobs table with status = 'published'. After seeding, update App.jsx to fetch jobs from Supabase instead of the local file:
   - Replace: import { ALL_JOBS } from './constants/jobs'
   - With: const { data: ALL_JOBS } = await supabase.from('jobs').select().eq('status', 'published')

9. **Replace the admin localStorage** with Supabase queries. The admin panel currently uses localStorage for job data. Replace with:
   - Load: supabase.from('jobs').select()
   - Save: supabase.from('jobs').upsert(job)
   - Delete: supabase.from('jobs').delete().eq('id', jobId)
   - Import: supabase.from('jobs').insert(newJobs)

10. **Do NOT touch these files** unless necessary:
    - src/services/matchingEngine.js (the scoring algorithm — keep as-is)
    - src/constants/fieldFamilies.js (matching engine lookup data)
    - Any component styling or layout

### CRITICAL RULES

- **Read SECURITY.md** — all security requirements are there
- **RLS is already set up** in the migration SQL — do not disable it on any table
- **Only the anon key** goes in frontend code — never the service role key
- **Do not redesign the UI** — preserve all existing styling, layout, and behavior exactly
- **Do not simplify the matching engine** — it's complex for a reason
- **Error handling** — all Supabase calls must handle errors. No silent failures. Show user-friendly error messages.
- **The useStore hook** (src/hooks/useStore.js) currently syncs to localStorage. When replacing with Supabase, maintain the same API so components don't need to change their state management pattern.

### PAYMENT SYSTEM (DO NOT ACTIVATE)

The project includes two Supabase Edge Functions for M-Pesa payments:
- supabase/functions/initiate-payment/ — sends STK push to phone
- supabase/functions/payment-callback/ — processes gateway callback

These are pre-built and gateway-agnostic. Do NOT deploy or activate them. They will be configured later when a payment gateway is chosen. The environment variable VITE_PREMIUM_FREE_PERIOD=true keeps the paywall off — all users get premium free.

### WHAT SUCCESS LOOKS LIKE

When you're done, I should be able to:
1. Open the site and browse all 280 jobs without logging in
2. Click "Profile" and see a login/register modal
3. Create an account with email or Google
4. Build my profile and see match scores on every job
5. Navigate to /#/admin, log in with my admin account, and manage jobs
6. All data persists in Supabase — not localStorage
7. The site works on mobile (it's already responsive)

### PROJECT STRUCTURE FOR REFERENCE

```
src/
  App.jsx                    — Main job listing app
  Router.jsx                 — Routes / and /#/admin
  main.jsx                   — Entry point
  components/
    AuthScreen.jsx           — Login/register with Google + email
    Detail.jsx               — Job detail view with match breakdown
    ProfileBuilder.jsx       — Candidate profile form
  pages/
    Admin.jsx                — Admin CMS for job management
  hooks/
    useStore.js              — Persistent state (localStorage → Supabase)
  services/
    matchingEngine.js        — Scoring algorithm (385 lines)
    storage.js               — Async storage abstraction
    supabase.js              — Supabase client (uncomment + configure)
  constants/
    theme.js                 — Colors and UI tokens
    education.js             — Education levels, rankings
    sectors.js               — Job sectors
    fieldPills.js            — 43 accepted degree fields
    profQuals.js             — 29 professional qualifications
    profBodies.js            — 27 professional bodies
    fieldFamilies.js         — 58 field family mappings (matching engine IP)
    jobs.js                  — 280 seed jobs (move to database)
    index.js                 — Barrel export
  styles/
    global.css               — Base styles
supabase/
  migrations/
    001_initial_schema.sql   — Database schema with RLS
  functions/
    initiate-payment/        — M-Pesa Edge Function (dormant)
    payment-callback/        — M-Pesa callback handler (dormant)
public/
  manifest.json              — PWA manifest
  icon.svg                   — App icon
SECURITY.md                  — Mandatory security rules
.env.example                 — Environment variable template
```
