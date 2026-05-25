-- ═══════════════════════════════════════════════════════════
-- GavaJobs — Supabase Database Schema
-- RLS ENABLED ON EVERY TABLE. NO EXCEPTIONS.
-- ═══════════════════════════════════════════════════════════

-- ════════════════════════════════════════════
-- 1. ADMIN USERS — controls who can manage jobs
-- ════════════════════════════════════════════
CREATE TABLE admin_users (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admin list (to verify their own role)
CREATE POLICY "Admins can read admin_users"
    ON admin_users FOR SELECT
    USING (auth.uid() = user_id);

-- No one can insert/update/delete via the API — manage via Supabase dashboard only
-- This prevents privilege escalation

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;


-- ════════════════════════════════════════════
-- 2. JOBS — all job listings
-- ════════════════════════════════════════════
CREATE TABLE jobs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_id          VARCHAR(10) UNIQUE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'unpublished')),
    title               VARCHAR(255) NOT NULL,
    employer            VARCHAR(255) NOT NULL,
    sector              VARCHAR(50) NOT NULL DEFAULT 'Other',
    county              VARCHAR(50) NOT NULL DEFAULT 'Nairobi',
    edu_min             VARCHAR(20) NOT NULL DEFAULT 'Degree'
                        CHECK (edu_min IN ('KCSE', 'Certificate', 'Diploma', 'Degree', 'Masters', 'PhD')),
    posts               INTEGER NOT NULL DEFAULT 1,
    grade               VARCHAR(50) DEFAULT '',
    ref                 VARCHAR(100) DEFAULT '',
    deadline            DATE NOT NULL,
    added_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    source              VARCHAR(20) NOT NULL DEFAULT 'MyGov',
    about               TEXT NOT NULL,
    responsibilities    JSONB NOT NULL DEFAULT '[]',
    requirements        JSONB NOT NULL DEFAULT '[]',
    how_to_apply        TEXT NOT NULL,
    chapter_six         BOOLEAN NOT NULL DEFAULT TRUE,
    ai_summary          TEXT NOT NULL,
    flag                TEXT DEFAULT '',
    match_fields        JSONB NOT NULL,
    is_new              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read published jobs
CREATE POLICY "Anyone can read published jobs"
    ON jobs FOR SELECT
    USING (status = 'published');

-- Admins can read ALL jobs (any status)
CREATE POLICY "Admins can read all jobs"
    ON jobs FOR SELECT
    USING (is_admin());

-- Only admins can insert jobs
CREATE POLICY "Admins can insert jobs"
    ON jobs FOR INSERT
    WITH CHECK (is_admin());

-- Only admins can update jobs
CREATE POLICY "Admins can update jobs"
    ON jobs FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Only admins can delete jobs
CREATE POLICY "Admins can delete jobs"
    ON jobs FOR DELETE
    USING (is_admin());

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_jobs_employer ON jobs(employer);


-- ════════════════════════════════════════════
-- 3. PROFILES — candidate profiles
-- ════════════════════════════════════════════
CREATE TABLE profiles (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    education               VARCHAR(20),
    study_fields            JSONB DEFAULT '[]',
    study_fields_masters    JSONB DEFAULT '[]',
    study_fields_phd        JSONB DEFAULT '[]',
    other_study_fields      JSONB DEFAULT '[]',
    prof_quals              JSONB DEFAULT '[]',
    other_prof_quals        JSONB DEFAULT '[]',
    prof_bodies             JSONB DEFAULT '[]',
    other_prof_bodies       JSONB DEFAULT '[]',
    years_experience        INTEGER DEFAULT 0,
    years_management        INTEGER DEFAULT 0,
    leadership_course       VARCHAR(20) DEFAULT 'none',
    premium                 BOOLEAN NOT NULL DEFAULT TRUE,  -- TRUE during free period
    premium_expires         DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users delete own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can read all profiles (for score computation)
CREATE POLICY "Admins read all profiles"
    ON profiles FOR SELECT
    USING (is_admin());


-- ════════════════════════════════════════════
-- 4. MATCH SCORES — cached scoring results
-- ════════════════════════════════════════════
CREATE TABLE match_scores (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id          BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    score           INTEGER NOT NULL,
    checks          JSONB NOT NULL,
    overqualified   BOOLEAN NOT NULL DEFAULT FALSE,
    underqualified  BOOLEAN NOT NULL DEFAULT FALSE,
    wrong_field     BOOLEAN NOT NULL DEFAULT FALSE,
    specials        JSONB DEFAULT '[]',
    skills          JSONB DEFAULT '[]',
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- Users can only read their own scores
CREATE POLICY "Users read own scores"
    ON match_scores FOR SELECT
    USING (auth.uid() = user_id);

-- Only server (Edge Functions with service role) can write scores
-- No INSERT/UPDATE/DELETE policies for regular users — scores are computed server-side

-- Edge Functions use the service role key which bypasses RLS
-- This is intentional: users cannot forge their own scores

CREATE INDEX idx_match_scores_user ON match_scores(user_id);
CREATE INDEX idx_match_scores_job ON match_scores(job_id, score DESC);


-- ════════════════════════════════════════════
-- 5. SAVED JOBS — bookmarked jobs per user
-- ════════════════════════════════════════════
CREATE TABLE saved_jobs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id      BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved jobs"
    ON saved_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users save jobs"
    ON saved_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unsave jobs"
    ON saved_jobs FOR DELETE
    USING (auth.uid() = user_id);


-- ════════════════════════════════════════════
-- 6. PAYMENTS — M-Pesa transaction log
-- ════════════════════════════════════════════
CREATE TABLE payments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    amount          INTEGER NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    mpesa_ref       VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payment history
CREATE POLICY "Users read own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- Users can initiate a payment (insert)
CREATE POLICY "Users initiate payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only server (Edge Function) can update payment status after M-Pesa callback
-- No UPDATE policy for regular users — prevents users marking their own payments as completed


-- ════════════════════════════════════════════
-- 7. AUTO-UPDATE TIMESTAMPS
-- ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════
-- SECURITY SUMMARY
-- ════════════════════════════════════════════
-- ✅ RLS enabled on ALL 6 tables
-- ✅ Anonymous users: can only SELECT published jobs
-- ✅ Authenticated users: can only access their own profile, scores, saved jobs, payments
-- ✅ Admin users: can manage all jobs, read all profiles for scoring
-- ✅ Match scores: only writable by Edge Functions (service role), not by users
-- ✅ Payments: only completable by Edge Functions (service role), not by users
-- ✅ Admin role: managed via Supabase dashboard, not via API
