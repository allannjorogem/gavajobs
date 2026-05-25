# GavaJobs Security Requirements

## READ THIS BEFORE MAKING ANY CHANGES

### Rule 1: Frontend is UNTRUSTED
The frontend (everything in src/) runs in the user's browser. It can be inspected, modified, and spoofed. NEVER rely on frontend code for security. All security enforcement happens in Supabase RLS policies and Edge Functions.

### Rule 2: Only the ANON KEY in frontend
The file `src/services/supabase.js` uses `VITE_SUPABASE_ANON_KEY`. This is the PUBLIC key — safe to expose. The SERVICE ROLE KEY must NEVER appear in any file under src/. It may only be used in Supabase Edge Functions (server-side).

### Rule 3: RLS on EVERY table
Every table in the database has Row Level Security enabled. No exceptions. The migration file (`supabase/migrations/001_initial_schema.sql`) includes all policies. Do not disable RLS on any table.

### Rule 4: user_id isolation
Every user-owned table (profiles, match_scores, payments, saved_jobs) has a `user_id` column referencing `auth.users(id)`. All RLS policies use `auth.uid() = user_id` to ensure users can only access their own data.

### Rule 5: Admin role
The `admin_users` table controls who can manage jobs. Admin operations (insert, update, delete jobs) check `auth.uid() IN (SELECT user_id FROM admin_users)`. Regular users cannot modify job data even if they craft direct Supabase queries.

### Rule 6: No public writes
Anonymous users (not logged in) can only SELECT published jobs. They cannot insert, update, or delete anything. The anon key + RLS policies enforce this.

### Rule 7: Error handling
All Supabase calls must handle errors. Never silently swallow failures. The storage service (`src/services/storage.js`) includes error handling patterns — follow them for any new queries.

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co     # Safe in frontend
VITE_SUPABASE_ANON_KEY=eyJ...                           # Safe in frontend (public key)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                         # NEVER in frontend — Edge Functions only
```
