# 🗄️ Supabase Setup Guide - Step by Step

Supabase does **NOT** automatically create tables. You must manually create them via the Supabase UI or SQL Editor.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in / Sign up
3. Click **"New Project"**
4. Fill in:
   - **Name**: `bongard-experiment`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait ~2 minutes for project creation

---

## Step 2: Get Your API Keys

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`
4. Create `.env.local` in your Next.js project:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

---

## Step 3: Create Tables

Go to **SQL Editor** in Supabase dashboard and run these commands **in order**:

### 3.1 Create `participants` Table

```sql
-- Table for participant information
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id TEXT UNIQUE NOT NULL,
    email TEXT,
    enrollment_number TEXT,
    assigned_group INTEGER NOT NULL CHECK (assigned_group BETWEEN 1 AND 6),
    consent BOOLEAN DEFAULT FALSE,
    share_data BOOLEAN DEFAULT FALSE,
    n_per_category INTEGER DEFAULT 10,
    metadata_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_participants_email ON participants(LOWER(email));
CREATE INDEX idx_participants_enrollment ON participants(LOWER(enrollment_number));
CREATE INDEX idx_participants_group ON participants(assigned_group);
```

**Click "Run" and verify you see "Success"**

### 3.2 Create `sessions` Table

```sql
-- Table for tracking quiz progress
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    current_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    assignment_json JSONB NOT NULL,
    category_map JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_participant ON sessions(participant_id);
CREATE INDEX idx_sessions_completed ON sessions(completed);
CREATE UNIQUE INDEX idx_sessions_active ON sessions(participant_id) WHERE completed = FALSE;
```

**Click "Run" and verify you see "Success"**

### 3.3 Create `responses` Table

```sql
-- Table for recording answers
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    category TEXT NOT NULL,
    answer TEXT NOT NULL CHECK (answer IN ('positive', 'negative')),
    is_correct BOOLEAN NOT NULL,
    reaction_time REAL NOT NULL,
    question_number INTEGER,
    mouse_data_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_responses_participant ON responses(participant_id);
CREATE INDEX idx_responses_session ON responses(session_id);
CREATE INDEX idx_responses_category ON responses(category);
CREATE INDEX idx_responses_correct ON responses(is_correct);
CREATE INDEX idx_responses_created ON responses(created_at);
```

**Click "Run" and verify you see "Success"**

### 3.4 Create `invites` Table (for invite script)

```sql
-- Table for managing invite links
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    assigned_group INTEGER NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_invites_code ON invites(invite_code);
CREATE INDEX idx_invites_email ON invites(LOWER(email));
CREATE INDEX idx_invites_used ON invites(used);
```

**Click "Run" and verify you see "Success"**

---

## Step 4: Verify Tables Created

1. Go to **Table Editor** in Supabase dashboard
2. You should see 4 tables:
   - ✅ `participants`
   - ✅ `sessions`
   - ✅ `responses`
   - ✅ `invites`

---

## Step 5: Enable Row Level Security (Optional but Recommended)

```sql
-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Allow public access for insert (needed for anonymous participants)
CREATE POLICY "Allow public insert to participants"
    ON participants FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public read own participant"
    ON participants FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert to sessions"
    ON sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update own session"
    ON sessions FOR UPDATE
    USING (true);

CREATE POLICY "Allow public insert to responses"
    ON responses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public read invites"
    ON invites FOR SELECT
    USING (true);

CREATE POLICY "Allow public update invites"
    ON invites FOR UPDATE
    USING (true);
```

---

## Step 6: Test Connection

Run this in SQL Editor to verify:

```sql
-- Insert test participant
INSERT INTO participants (participant_id, email, assigned_group, consent)
VALUES ('test_001', 'test@example.com', 1, TRUE)
RETURNING *;

-- Insert test session
INSERT INTO sessions (participant_id, total_questions, assignment_json)
VALUES ('test_001', 40, '["ff_001_pos", "bd_002_neg"]'::jsonb)
RETURNING *;

-- Verify data
SELECT * FROM participants;
SELECT * FROM sessions;
```

---

## Summary: Tables & Columns

### `participants`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `participant_id` | TEXT | Unique identifier (e.g., "pid_12345") |
| `email` | TEXT | Optional email address |
| `enrollment_number` | TEXT | Optional student ID |
| `assigned_group` | INTEGER | Group 1-6 |
| `consent` | BOOLEAN | Consent given |
| `share_data` | BOOLEAN | Data sharing consent |
| `n_per_category` | INTEGER | Questions per category (default: 10) |
| `metadata_json` | JSONB | Additional metadata |
| `created_at` | TIMESTAMPTZ | Registration time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### `sessions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `participant_id` | TEXT | Reference to participant |
| `current_index` | INTEGER | Current question (0-based) |
| `total_questions` | INTEGER | Total assigned questions |
| `completed` | BOOLEAN | Quiz finished |
| `assignment_json` | JSONB | Array of question IDs |
| `category_map` | JSONB | Map of question ID → category |
| `started_at` | TIMESTAMPTZ | Session start time |
| `completed_at` | TIMESTAMPTZ | Session completion time |
| `last_activity_at` | TIMESTAMPTZ | Last user interaction |

### `responses`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `participant_id` | TEXT | Reference to participant |
| `session_id` | UUID | Reference to session |
| `question_id` | TEXT | Question test_id |
| `category` | TEXT | ff, bd, hd_novel, hd_comb |
| `answer` | TEXT | 'positive' or 'negative' |
| `is_correct` | BOOLEAN | Answer correctness |
| `reaction_time` | REAL | Response time (seconds) |
| `question_number` | INTEGER | Position in quiz |
| `mouse_data_json` | JSONB | Mouse tracking data |
| `created_at` | TIMESTAMPTZ | Answer time |

### `invites`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `participant_id` | TEXT | Reference to participant |
| `invite_code` | TEXT | Unique invite code |
| `email` | TEXT | Invited email |
| `assigned_group` | INTEGER | Assigned group |
| `used` | BOOLEAN | Invite used |
| `used_at` | TIMESTAMPTZ | When used |
| `created_at` | TIMESTAMPTZ | When created |
| `expires_at` | TIMESTAMPTZ | Expiration time |

---

## Next Steps

After creating tables:

1. ✅ Tables created in Supabase
2. ✅ Environment variables set in Next.js
3. ⏳ Update Next.js app to use Supabase
4. ⏳ Run invite generation script
5. ⏳ Test end-to-end flow

---

**Supabase does NOT auto-create tables. You must run the SQL commands above manually!**
