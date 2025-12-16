# 🚀 Quick Setup Guide - Supabase Integration

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create Project
1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose:
   - Name: `bongard-experiment`
   - Region: Closest to your users
   - Generate a strong database password (save it!)
4. Wait ~2 minutes for setup

### 1.2 Get API Keys
1. In Supabase dashboard → **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`

### 1.3 Configure Next.js
1. In your Next.js project root, create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

---

## Step 2: Create Database Tables (3 minutes)

1. In Supabase dashboard → **SQL Editor**
2. Run the SQL commands from `docs/SUPABASE_SETUP.md` in this order:
   - ✅ Create `participants` table
   - ✅ Create `sessions` table
   - ✅ Create `responses` table
   - ✅ Create `invites` table
   - ✅ Enable Row Level Security (optional but recommended)

3. Verify in **Table Editor** that all 4 tables exist

---

## Step 3: Test the Connection (2 minutes)

### Test from SQL Editor
```sql
-- Insert test participant
INSERT INTO participants (participant_id, email, assigned_group, consent)
VALUES ('test_001', 'test@example.com', 1, TRUE)
RETURNING *;

-- Verify
SELECT * FROM participants;
```

### Test from Next.js App
1. Open your browser console
2. Navigate to any quiz page (e.g., `http://localhost:3000/test_user?group=1`)
3. Check the Network tab for API calls to `/api/participants`, `/api/sessions`, `/api/responses`

---

## API Endpoints Available

### Participants
- **POST** `/api/participants` - Create/update participant
- **GET** `/api/participants?participant_id=XXX` - Get participant

### Sessions
- **POST** `/api/sessions` - Create new session
- **GET** `/api/sessions?participant_id=XXX` - Get active session

### Responses
- **POST** `/api/responses` - Save answer

---

## Testing the Full Flow

```typescript
// 1. Create participant
const participant = await fetch('/api/participants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: 'user_123',
    assigned_group: 1,
    consent: true,
  })
});

// 2. Create session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: 'user_123',
    total_questions: 40,
    assignment_json: ['ff_001_pos', 'bd_002_neg'],
  })
});

// 3. Save response
const response = await fetch('/api/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: 'user_123',
    session_id: 'session-uuid',
    question_id: 'ff_001_pos',
    category: 'ff',
    answer: 'positive',
    is_correct: true,
    reaction_time: 2.5,
  })
});
```

---

## Group Configuration

### Group 1 (Visual Only)
- **Concept**: Hidden
- URL: `http://localhost:3000/user_id?group=1`

### Group 4 (Visual + Concept)
- **Concept**: Shown in header
- URL: `http://localhost:3000/user_id?group=4`

---

## Troubleshooting

### Error: "Missing Supabase credentials"
- Ensure `.env.local` exists and has correct values
- Restart dev server after creating `.env.local`

### Error: "Table does not exist"
- Run all SQL commands in Supabase SQL Editor
- Verify tables exist in Table Editor

### Error: "Row Level Security"
- If RLS is enabled, ensure policies allow INSERT/SELECT
- See `docs/SUPABASE_SETUP.md` for policy SQL

---

## Files Created

✅ `src/lib/supabase.ts` - Client-side Supabase client
✅ `src/lib/supabase-api.ts` - Database helper functions
✅ `src/app/api/participants/route.ts` - Participant API
✅ `src/app/api/sessions/route.ts` - Session API
✅ `src/app/api/responses/route.ts` - Response API
✅ `.env.local.example` - Environment template

---

## Next Steps

1. ✅ Supabase configured
2. ✅ Tables created
3. ✅ API routes working
4. ⏳ Update quiz page to save responses automatically
5. ⏳ Add participant registration/consent flow
6. ⏳ Generate invite codes

See `docs/SUPABASE_SETUP.md` for detailed table schemas and SQL commands.
