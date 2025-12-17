# Testing Script: Group Assignment Verification
# Run this after applying migrations and code changes

## Prerequisites
- [ ] Database migration applied (MIGRATION_ADD_ASSIGNED_GROUP.sql)
- [ ] Code changes deployed
- [ ] Application is running

---

## Test 1: New Participant - Group Assignment

### 1.1 Create Participant with Group 1
```bash
# Using curl or similar
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "test_participant_001",
    "assigned_group": 1,
    "consent": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "participant_id": "test_participant_001",
    "assigned_group": 1,
    "consent": true
  }
}
```

### 1.2 Verify in Supabase
```sql
SELECT participant_id, assigned_group, consent 
FROM participants 
WHERE participant_id = 'test_participant_001';
```

**Expected**: `assigned_group = 1`

---

## Test 2: Session Creation with Group

### 2.1 Visit Quiz Page
Open browser: `http://localhost:3000/test_participant_001?group=1`

**Expected**:
- Quiz loads successfully
- Shows "Group: 1" in loading screen
- Session created automatically

### 2.2 Verify Session in Supabase
```sql
SELECT id, participant_id, assigned_group, total_questions, completed
FROM sessions 
WHERE participant_id = 'test_participant_001'
ORDER BY started_at DESC
LIMIT 1;
```

**Expected**: 
- `assigned_group = 1`
- `completed = false`

---

## Test 3: Response Saving with Group

### 3.1 Answer First Question
- In the quiz, click "Submit Response"
- Select either "Positive" or "Negative"

### 3.2 Verify Response in Supabase
```sql
SELECT 
  participant_id, 
  session_id, 
  question_id, 
  category,
  assigned_group,
  answer,
  is_correct
FROM responses 
WHERE participant_id = 'test_participant_001'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `assigned_group = 1`
- `participant_id = 'test_participant_001'`
- `answer` is either 'positive' or 'negative'

---

## Test 4: Group Mismatch Detection

### 4.1 Try Wrong Group in URL
With existing session for group 1, try: `http://localhost:3000/test_participant_001?group=4`

**Expected Behavior**:
1. Shows error message: "Group mismatch detected. You are assigned to group 1. Redirecting..."
2. After 2 seconds, redirects to: `http://localhost:3000/test_participant_001?group=1`
3. Resumes session correctly

### 4.2 Check Console Logs
Look for:
```
❌ Group mismatch: URL has group 4, but participant assigned to group 1
```

---

## Test 5: Session Resume Verification

### 5.1 Start Fresh Session
1. Create new participant: `test_participant_002` with group 1
2. Visit: `http://localhost:3000/test_participant_002?group=1`
3. Answer 3-5 questions
4. Note the question number (e.g., "Question 4 of 40")

### 5.2 Close and Reopen
1. Close browser tab
2. Reopen: `http://localhost:3000/test_participant_002?group=1`

**Expected**:
- Shows "🔄 Resuming previous session..." in loading screen
- Continues from where you left off (e.g., Question 5 of 40)

### 5.3 Verify Session Data
```sql
SELECT 
  participant_id,
  assigned_group,
  current_index,
  total_questions,
  completed
FROM sessions
WHERE participant_id = 'test_participant_002';
```

**Expected**:
- `assigned_group = 1`
- `current_index` matches where you left off
- `completed = false`

---

## Test 6: Invalid Group Prevention

### 6.1 Try Unsupported Group
Assuming `config.json` has `"supported_groups": [1, 4]`, try:

```bash
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "test_participant_003",
    "assigned_group": 2,
    "consent": true
  }'
```

**Expected Response**:
```json
{
  "error": "Invalid group 2. Supported groups: 1, 4"
}
```

Status code: `400`

### 6.2 Try Group Out of Range
```bash
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "test_participant_004",
    "assigned_group": 7,
    "consent": true
  }'
```

**Expected**: Similar error about unsupported group

---

## Test 7: Complete Flow - Full Session

### 7.1 Create and Complete Full Session
1. Create participant: `test_full_001` with group 1
2. Visit quiz page with `?group=1`
3. Answer ALL questions until completion
4. See "Quiz Completed! 🎉" message

### 7.2 Verify Completed Session
```sql
SELECT 
  participant_id,
  assigned_group,
  current_index,
  total_questions,
  completed,
  completed_at
FROM sessions
WHERE participant_id = 'test_full_001';
```

**Expected**:
- `completed = true`
- `completed_at` is not null
- `current_index >= total_questions`

### 7.3 Verify All Responses Have Same Group
```sql
SELECT 
  COUNT(*) as total_responses,
  COUNT(DISTINCT assigned_group) as distinct_groups,
  MIN(assigned_group) as min_group,
  MAX(assigned_group) as max_group
FROM responses
WHERE participant_id = 'test_full_001';
```

**Expected**:
- `total_responses` = total_questions from session
- `distinct_groups = 1`
- `min_group = 1`
- `max_group = 1`

---

## Test 8: Data Consistency Checks

### 8.1 Cross-Table Group Consistency
```sql
-- Should return 0 rows (no mismatches)
SELECT 
  r.participant_id,
  p.assigned_group as participant_group,
  s.assigned_group as session_group,
  r.assigned_group as response_group
FROM responses r
JOIN participants p ON r.participant_id = p.participant_id
JOIN sessions s ON r.session_id = s.id
WHERE p.assigned_group != s.assigned_group 
   OR s.assigned_group != r.assigned_group
   OR p.assigned_group != r.assigned_group;
```

**Expected**: 0 rows

### 8.2 Group Distribution
```sql
-- Check distribution across all tables
SELECT 'participants' as table_name, assigned_group, COUNT(*) as count
FROM participants
WHERE participant_id LIKE 'test_%'
GROUP BY assigned_group

UNION ALL

SELECT 'sessions', assigned_group, COUNT(*)
FROM sessions
WHERE participant_id LIKE 'test_%'
GROUP BY assigned_group

UNION ALL

SELECT 'responses', assigned_group, COUNT(*)
FROM responses
WHERE participant_id LIKE 'test_%'
GROUP BY assigned_group
ORDER BY table_name, assigned_group;
```

**Expected**: Counts should align logically
- Each participant should have ≤ 1 session
- Each session should have multiple responses
- All groups should match

---

## Test 9: Performance Check

### 9.1 Load Time with Group Verification
1. Open browser DevTools → Network tab
2. Visit: `http://localhost:3000/test_participant_001?group=1`
3. Measure:
   - Time to First Contentful Paint
   - Time to Interactive
   - Number of API calls

**Expected**:
- Load time < 2 seconds
- 3-4 API calls total:
  1. `/api/participants` (POST)
  2. `/api/sessions/resume` (GET)
  3. `/api/participants` (GET for verification)
  4. `/api/sessions` (POST or resume existing)

---

## Test 10: Browser Console Checks

### 10.1 Expected Console Messages
When loading a quiz page, look for:

```
🔍 Checking for incomplete session...
✅ New session created: <session-id>
```

Or when resuming:

```
🔍 Checking for incomplete session...
🔄 Found incomplete session - resuming... <session-id>
✅ Resuming from question X/Y
```

### 10.2 When Submitting Responses
```
✅ Response saved: <question-id>
```

### 10.3 No Errors
**Expected**: No red error messages in console

---

## Cleanup After Testing

```sql
-- Delete test data
DELETE FROM responses WHERE participant_id LIKE 'test_%';
DELETE FROM sessions WHERE participant_id LIKE 'test_%';
DELETE FROM participants WHERE participant_id LIKE 'test_%';

-- Verify cleanup
SELECT COUNT(*) FROM participants WHERE participant_id LIKE 'test_%';
SELECT COUNT(*) FROM sessions WHERE participant_id LIKE 'test_%';
SELECT COUNT(*) FROM responses WHERE participant_id LIKE 'test_%';
-- All should return 0
```

---

## Success Criteria

✅ **All tests pass if**:
1. Group field is saved correctly in all tables
2. Group mismatch redirects work
3. Session resume verifies group
4. Invalid groups are rejected
5. Data consistency checks show 0 mismatches
6. No console errors during normal flow
7. Performance is acceptable (< 2s load time)

---

## Troubleshooting

### Issue: "Missing required fields: assigned_group"
**Cause**: API route not receiving group parameter  
**Fix**: Check that code changes are deployed

### Issue: "Column assigned_group does not exist"
**Cause**: Database migration not run  
**Fix**: Run MIGRATION_ADD_ASSIGNED_GROUP.sql in Supabase SQL Editor

### Issue: Group mismatch not redirecting
**Cause**: JavaScript code not running or error in verification logic  
**Fix**: Check browser console for errors, verify code changes

### Issue: Responses missing assigned_group
**Cause**: Old code version still running  
**Fix**: Hard refresh (Cmd+Shift+R), restart dev server, check deployment

---

## Test Results Log Template

```
Date: _______________
Tester: _______________

Test 1: New Participant - Group Assignment     [ ] PASS  [ ] FAIL
Test 2: Session Creation with Group            [ ] PASS  [ ] FAIL
Test 3: Response Saving with Group             [ ] PASS  [ ] FAIL
Test 4: Group Mismatch Detection               [ ] PASS  [ ] FAIL
Test 5: Session Resume Verification            [ ] PASS  [ ] FAIL
Test 6: Invalid Group Prevention               [ ] PASS  [ ] FAIL
Test 7: Complete Flow - Full Session           [ ] PASS  [ ] FAIL
Test 8: Data Consistency Checks                [ ] PASS  [ ] FAIL
Test 9: Performance Check                      [ ] PASS  [ ] FAIL
Test 10: Browser Console Checks                [ ] PASS  [ ] FAIL

Overall Result: [ ] PASS  [ ] FAIL

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```
