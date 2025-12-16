````markdown
# Supabase Integration - Setup Complete! ✅

## What's Been Set Up

### 1. **Supabase Client & API** (`src/lib/`)
- ✅ `supabase.ts` - Client-side Supabase connection
- ✅ `supabase-api.ts` - Database helper functions for participants, sessions, responses

### 2. **API Routes** (`src/app/api/`)
- ✅ `participants/route.ts` - Create/get participants
- ✅ `sessions/route.ts` - Manage quiz sessions
- ✅ `responses/route.ts` - Save answers

### 3. **Group-Based UI** (Task 2 ✅)
- ✅ **Group 1**: Concept hidden (visual-only)
- ✅ **Group 4**: Concept shown in header
- Updated `QuizHeader` component to conditionally display concept

### 4. **Response Tracking**
- ✅ Automatic reaction time measurement
- ✅ Answer correctness calculation
- ✅ Response saving on submit

---

## Next Steps for You

### Step 1: Configure Supabase (5 min)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project: `bongard-experiment`
   - Save your database password!

2. **Get API Keys**
   - Dashboard → Settings → API
   - Copy Project URL and anon key

3. **Create `.env.local`**
   ```bash
   # In project root
   cp .env.local.example .env.local
   ```

4. **Add your keys to `.env.local`**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Restart dev server**
   ```bash
   npm run dev
   ```

### Step 2: Create Database Tables (3 min)

1. Open Supabase Dashboard → **SQL Editor**
2. Run each SQL block from `docs/SUPABASE_SETUP.md`:
   - Create `participants` table ✓
   - Create `sessions` table ✓
   - Create `responses` table ✓
   - Create `invites` table ✓
   - Enable Row Level Security ✓

3. Verify in **Table Editor** that all tables exist

### Step 3: Test It! (2 min)

1. **Test Group 1 (no concept)**:
   ```
   http://localhost:3000/test_user?group=1
   ```
   - Concept should be **hidden**

2. **Test Group 4 (with concept)**:
   ```
   http://localhost:3000/test_user?group=4
   ```
   - Concept should be **visible** in header

3. **Check responses are saved**:
   - Answer a few questions
   - In Supabase → Table Editor → `responses`
   - You should see your answers!

---

## Testing Checklist

- [ ] `.env.local` created with Supabase keys
- [ ] Dev server restarted
- [ ] All 4 tables created in Supabase
- [ ] Group 1: Concept hidden ✓
- [ ] Group 4: Concept visible ✓
- [ ] Responses saved to database ✓

---

## How Response Saving Works

```typescript
// When user submits answer:
1. Calculate reaction time (from question display to submit)
2. Determine correctness (based on question_id ending: _pos or _neg)
3. POST to /api/responses with:
   - participant_id
   - question_id
   - answer ("positive" or "negative")
   - is_correct (boolean)
   - reaction_time (seconds)
   - category (ff, bd, hd_novel, hd_comb)
```

---

## API Usage Examples

### Get Participant
```typescript
const res = await fetch('/api/participants?participant_id=test_user');
const { data } = await res.json();
```

### Create Session
```typescript
const res = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: 'test_user',
    total_questions: 40,
    assignment_json: quizQuestionIds,
  })
});
```

### Save Response
```typescript
const res = await fetch('/api/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: 'test_user',
    session_id: sessionId,
    question_id: 'ff_001_pos',
    category: 'ff',
    answer: 'positive',
    is_correct: true,
    reaction_time: 2.5,
  })
});
```

---

## Documentation

- 📖 **Quick Start**: `docs/SUPABASE_QUICK_START.md`
- 📖 **Full Setup**: `docs/SUPABASE_SETUP.md`
- 📖 **Architecture**: `docs/ARCHITECTURE.md`

---

## Troubleshooting

### "Supabase credentials not found"
- Check `.env.local` exists
- Restart dev server: `npm run dev`

### "Table does not exist"
- Run SQL commands in Supabase SQL Editor
- Verify in Table Editor

### Responses not saving
- Check browser console for errors
- Verify Supabase URL and key are correct
- Check Supabase logs for permission errors

---

## What Changed

### Task 1: Supabase Integration ✅
- Created Supabase client and API helpers
- Built 3 API routes (participants, sessions, responses)
- Integrated response saving into quiz flow

### Task 2: Group-Based Concept Display ✅
- **Group 1**: Concept hidden (pure visual)
- **Group 4**: Concept shown (visual + concept description)
- Updated `QuizHeader` to accept `group` prop
- Added conditional rendering based on group

---

Ready to test! 🚀

1. Set up Supabase credentials
2. Create tables
3. Test both groups
4. Check responses in database

````
