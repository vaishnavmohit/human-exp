# Supabase Integration Testing Guide

## Issues Found & Fixed ✅

### Problem 1: No Session Created
**Issue**: The quiz page was loading questions but never creating a session in Supabase.
**Fix**: Added session creation in the `useEffect` hook that runs when the quiz loads.

### Problem 2: Invalid Session ID
**Issue**: Code was using `'temp-session'` string instead of a real UUID from Supabase.
**Fix**: Now properly stores the session UUID returned from `/api/sessions` endpoint.

### Problem 3: Missing Participant Creation
**Issue**: No participant record was created before starting the quiz.
**Fix**: Added participant creation before session creation.

---

## Testing Steps

### 1. Check Browser Console
Open browser DevTools → Console tab, then navigate to quiz page:

```
http://localhost:3000/test_user_123?group=1
```

You should see:
```
✅ Session created: <uuid>
✅ Response saved: ff_001_pos
✅ Response saved: bd_002_neg
... (for each question answered)
```

### 2. Check Supabase Dashboard

Go to Supabase → Table Editor

**Check `participants` table:**
```sql
SELECT * FROM participants WHERE participant_id = 'test_user_123';
```

Expected result:
- participant_id: `test_user_123`
- assigned_group: `1`
- consent: `true`
- created_at: recent timestamp

**Check `sessions` table:**
```sql
SELECT * FROM sessions WHERE participant_id = 'test_user_123';
```

Expected result:
- id: UUID
- participant_id: `test_user_123`
- total_questions: 40 (or your config value)
- assignment_json: array of question IDs
- category_map: JSON with question→category mapping
- current_index: 0
- completed: false

**Check `responses` table:**
```sql
SELECT * FROM responses WHERE participant_id = 'test_user_123' ORDER BY created_at;
```

Expected result (after answering questions):
- participant_id: `test_user_123`
- session_id: matches session UUID
- question_id: e.g., `ff_001_pos`
- category: e.g., `ff`
- answer: `positive` or `negative`
- is_correct: true/false
- reaction_time: seconds (e.g., 2.5)
- question_number: 1, 2, 3, etc.

### 3. API Endpoint Tests

Test each endpoint individually:

**Create Participant:**
```bash
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "curl_test_001",
    "assigned_group": 4,
    "consent": true,
    "email": "test@example.com"
  }'
```

**Create Session:**
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "curl_test_001",
    "total_questions": 40,
    "assignment_json": ["ff_001_pos", "bd_002_neg"],
    "category_map": {"ff_001_pos": "ff", "bd_002_neg": "bd"}
  }'
```

Save the `id` from response (it's a UUID).

**Save Response:**
```bash
curl -X POST http://localhost:3000/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "curl_test_001",
    "session_id": "<paste-session-uuid-here>",
    "question_id": "ff_001_pos",
    "category": "ff",
    "answer": "positive",
    "is_correct": true,
    "reaction_time": 2.5,
    "question_number": 1
  }'
```

---

## Common Issues & Solutions

### Issue: "invalid input syntax for type uuid"
**Cause**: Session ID is not a valid UUID
**Fix**: Ensure session is created before saving responses (now handled automatically)

### Issue: "No active session found"
**Cause**: Session wasn't created or was marked as completed
**Fix**: Check session creation logic in quiz page initialization

### Issue: Responses not appearing in Supabase
**Check**:
1. Browser console for error messages
2. Network tab → Filter by "responses" → Check request/response
3. Supabase logs (Dashboard → Logs)
4. Row Level Security policies (might be blocking inserts)

### Issue: "Failed to create participant/session"
**Possible causes**:
1. `.env.local` not loaded (restart dev server)
2. Wrong Supabase URL or keys
3. Tables don't exist in Supabase
4. RLS policies preventing access

---

## Verification Checklist

- [ ] `.env.local` has correct Supabase credentials
- [ ] Dev server restarted after env changes
- [ ] All 4 tables exist in Supabase (participants, sessions, responses, invites)
- [ ] Browser console shows "✅ Session created"
- [ ] Browser console shows "✅ Response saved" after submitting answers
- [ ] Participant appears in Supabase `participants` table
- [ ] Session appears in Supabase `sessions` table
- [ ] Responses appear in Supabase `responses` table
- [ ] `session_id` in responses matches `id` in sessions table

---

## Code Changes Summary

### `src/app/[humanId]/page.tsx`

**Before:**
```typescript
useEffect(() => {
  loadQuiz(humanId as string, group)
    .then(setQuiz)
    .catch(...)
}, [humanId, group]);
```

**After:**
```typescript
useEffect(() => {
  const initializeQuiz = async () => {
    // 1. Load quiz questions
    const questions = await loadQuiz(humanId as string, group);
    
    // 2. Create participant
    await fetch('/api/participants', { method: 'POST', ... });
    
    // 3. Create session
    const sessionRes = await fetch('/api/sessions', { method: 'POST', ... });
    const sessionData = await sessionRes.json();
    setSessionId(sessionData.data.id); // Store UUID
    
    setQuiz(questions);
  };
  initializeQuiz();
}, [humanId, group]);
```

**handleSubmit changes:**
- Removed `sessionId || 'temp-session'` fallback
- Now checks `if (sessionId)` before saving
- Added better logging for debugging

---

## Next Steps

1. **Test the flow**: Open quiz page and answer a few questions
2. **Check Supabase**: Verify data appears in all tables
3. **Monitor console**: Look for any error messages
4. **Review logs**: Check Supabase Dashboard → Logs if issues persist

If you still don't see data:
- Check browser Network tab for failed API calls
- Verify RLS policies aren't blocking inserts
- Ensure Supabase project is active (not paused)
