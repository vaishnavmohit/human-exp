# Supabase Database Schema

This document defines the database schema for the Bongard Problem experiment application, migrated from the Flask app's SQLite schema.

## 📊 Tables Overview

```
participants  → Stores participant information and group assignment
    ├── responses  → Records participant answers (foreign key)
    └── sessions   → Tracks quiz progress (foreign key)
```

## 🗄️ Table Definitions

### 1. `participants`

Stores participant demographic and assignment information.

```sql
CREATE TABLE participants (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    participant_id TEXT UNIQUE NOT NULL,
    email TEXT,
    enrollment_number TEXT,
    
    -- Experiment assignment
    assigned_group INTEGER NOT NULL CHECK (assigned_group BETWEEN 1 AND 6),
    
    -- Consent and metadata
    consent BOOLEAN DEFAULT FALSE,
    share_data BOOLEAN DEFAULT FALSE,
    metadata_json JSONB,
    
    -- Configuration
    n_per_category INTEGER DEFAULT 10,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_enrollment ON participants(enrollment_number);
CREATE INDEX idx_participants_participant_id ON participants(participant_id);
CREATE INDEX idx_participants_assigned_group ON participants(assigned_group);
```

**Columns:**
- `id`: UUID primary key
- `participant_id`: Unique identifier (e.g., "participant_001", email)
- `email`: Optional email address
- `enrollment_number`: Optional enrollment/student number
- `assigned_group`: Group number (1-6)
  - 1: Visual only
  - 2: Formal symbolic
  - 3: Natural language
  - 4: Visual + concept
  - 5: Formal symbolic + concept
  - 6: Natural language + concept
- `consent`: Whether participant provided consent
- `share_data`: Whether participant agreed to share data
- `metadata_json`: Additional metadata (age, background, etc.)
- `n_per_category`: Number of questions per category for this participant
- `created_at`: Registration timestamp
- `updated_at`: Last update timestamp

---

### 2. `sessions`

Tracks participant quiz progress and question assignment.

```sql
CREATE TABLE sessions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to participants
    participant_id TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    
    -- Progress tracking
    current_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    
    -- Question assignment
    assignment_json JSONB NOT NULL,
    category_map JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_participant_id ON sessions(participant_id);
CREATE INDEX idx_sessions_completed ON sessions(completed);
CREATE UNIQUE INDEX idx_sessions_active ON sessions(participant_id) WHERE completed = FALSE;
```

**Columns:**
- `id`: UUID primary key
- `participant_id`: Reference to participant
- `current_index`: Current question number (0-based)
- `total_questions`: Total questions in this session
- `completed`: Whether session is finished
- `assignment_json`: Array of assigned test_ids
  ```json
  ["ff_nact4_5_0162_pos", "bd_basic_001_neg", ...]
  ```
- `category_map`: Mapping of test_id to category
  ```json
  {
    "ff_nact4_5_0162_pos": "ff",
    "bd_basic_001_neg": "bd"
  }
  ```
- `started_at`: When session began
- `completed_at`: When session finished
- `last_activity_at`: Last user interaction

---

### 3. `responses`

Records each participant's answer to each question.

```sql
CREATE TABLE responses (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    participant_id TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Question identification
    question_id TEXT NOT NULL,  -- test_id (e.g., "ff_nact4_5_0162_pos")
    category TEXT NOT NULL,      -- ff, bd, hd_novel, hd_comb
    
    -- Response data
    answer TEXT NOT NULL CHECK (answer IN ('positive', 'negative')),
    is_correct BOOLEAN NOT NULL,
    
    -- Timing data
    reaction_time REAL NOT NULL,  -- seconds
    
    -- Interaction tracking (optional)
    mouse_data_json JSONB,
    
    -- Metadata
    question_number INTEGER,  -- Position in quiz (1-based)
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_responses_participant_id ON responses(participant_id);
CREATE INDEX idx_responses_session_id ON responses(session_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_responses_category ON responses(category);
CREATE INDEX idx_responses_is_correct ON responses(is_correct);
CREATE INDEX idx_responses_created_at ON responses(created_at);
```

**Columns:**
- `id`: UUID primary key
- `participant_id`: Reference to participant
- `session_id`: Reference to session
- `question_id`: Test ID from metadata (e.g., "ff_nact4_5_0162_pos")
- `category`: Category (ff, bd, hd_novel, hd_comb)
- `answer`: Participant's choice ('positive' or 'negative')
- `is_correct`: Whether answer matches ground truth
- `reaction_time`: Time to answer in seconds
- `mouse_data_json`: Optional mouse movement tracking
  ```json
  {
    "movements": [[x1, y1, t1], [x2, y2, t2], ...],
    "clicks": [[x, y, t], ...]
  }
  ```
- `question_number`: Position in participant's quiz sequence
- `created_at`: Answer submission timestamp

---

## 🔐 Row Level Security (RLS)

Enable RLS for data privacy:

```sql
-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own participant data"
    ON participants FOR SELECT
    USING (participant_id = current_setting('app.current_participant_id', true));

CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (participant_id = current_setting('app.current_participant_id', true));

CREATE POLICY "Users can view own responses"
    ON responses FOR SELECT
    USING (participant_id = current_setting('app.current_participant_id', true));

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own responses"
    ON responses FOR INSERT
    WITH CHECK (participant_id = current_setting('app.current_participant_id', true));
```

---

## 📈 Useful Queries

### Get participant progress
```sql
SELECT 
    p.participant_id,
    p.assigned_group,
    s.current_index,
    s.total_questions,
    ROUND((s.current_index::FLOAT / s.total_questions) * 100, 2) as progress_pct,
    s.completed
FROM participants p
LEFT JOIN sessions s ON p.participant_id = s.participant_id
WHERE p.participant_id = 'participant_001';
```

### Get participant accuracy by category
```sql
SELECT 
    r.category,
    COUNT(*) as total_questions,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100, 2) as accuracy_pct,
    ROUND(AVG(reaction_time), 2) as avg_reaction_time
FROM responses r
WHERE participant_id = 'participant_001'
GROUP BY r.category
ORDER BY r.category;
```

### Get overall study statistics
```sql
SELECT 
    COUNT(DISTINCT p.participant_id) as total_participants,
    COUNT(DISTINCT CASE WHEN s.completed THEN p.participant_id END) as completed_participants,
    ROUND(AVG(r.reaction_time), 2) as avg_reaction_time,
    ROUND(AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) * 100, 2) as overall_accuracy
FROM participants p
LEFT JOIN sessions s ON p.participant_id = s.participant_id
LEFT JOIN responses r ON p.participant_id = r.participant_id;
```

### Get group comparison
```sql
SELECT 
    p.assigned_group,
    COUNT(DISTINCT p.participant_id) as n_participants,
    ROUND(AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) * 100, 2) as avg_accuracy,
    ROUND(AVG(r.reaction_time), 2) as avg_reaction_time
FROM participants p
JOIN responses r ON p.participant_id = r.participant_id
GROUP BY p.assigned_group
ORDER BY p.assigned_group;
```

---

## 🔄 Migration from SQLite (Flask App)

### Mapping

| SQLite Table | Supabase Table | Notes |
|--------------|----------------|-------|
| `participants` | `participants` | Added UUID, improved constraints |
| N/A | `sessions` | New table for better progress tracking |
| `responses` | `responses` | Added category, session_id |
| `otps` | ❌ Not needed | Using Supabase Auth instead |
| `email_assignments` | Merged into `participants` | Group assignment in one table |

### Key Differences

1. **UUIDs**: Supabase uses UUIDs for primary keys instead of auto-increment
2. **JSONB**: Native JSON support instead of TEXT fields
3. **Timestamps**: TIMESTAMPTZ with timezone support
4. **Foreign Keys**: Proper CASCADE delete constraints
5. **RLS**: Row-level security for data isolation

---

## 🚀 Setup Instructions

### 1. Create Tables

Run the SQL commands above in Supabase SQL Editor in this order:
1. `participants` table
2. `sessions` table
3. `responses` table
4. Indexes
5. RLS policies

### 2. Test Data (Optional)

```sql
-- Insert test participant
INSERT INTO participants (participant_id, email, assigned_group, consent, n_per_category)
VALUES ('test_001', 'test@example.com', 1, TRUE, 10);

-- Insert test session
INSERT INTO sessions (participant_id, total_questions, assignment_json, category_map)
VALUES ('test_001', 40, 
    '["ff_001_pos", "bd_002_neg"]'::jsonb,
    '{"ff_001_pos": "ff", "bd_002_neg": "bd"}'::jsonb
);
```

### 3. Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📊 Schema Visualization

```
┌─────────────────────────────┐
│      participants           │
├─────────────────────────────┤
│ id (PK)                     │
│ participant_id (UNIQUE)     │
│ email                       │
│ enrollment_number           │
│ assigned_group              │
│ consent                     │
│ n_per_category              │
│ created_at                  │
└──────────┬──────────────────┘
           │
           │ 1:1
           │
┌──────────▼──────────────────┐
│        sessions             │
├─────────────────────────────┤
│ id (PK)                     │
│ participant_id (FK)         │
│ current_index               │
│ assignment_json             │
│ completed                   │
│ started_at                  │
└──────────┬──────────────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────────┐
│       responses             │
├─────────────────────────────┤
│ id (PK)                     │
│ participant_id (FK)         │
│ session_id (FK)             │
│ question_id                 │
│ answer                      │
│ is_correct                  │
│ reaction_time               │
│ created_at                  │
└─────────────────────────────┘
```

---

This schema supports all features from the Flask app plus improvements for scalability and analytics.
