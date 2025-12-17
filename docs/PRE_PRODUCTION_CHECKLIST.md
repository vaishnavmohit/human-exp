# Pre-Production Checklist: Group Assignment & Response Tracking

## 🔍 Critical Issues Found

### **Issue #1: Group Not Verified on Session Resume** ❌
**Location**: `src/app/[humanId]/page.tsx` (Line 71-87)

**Problem**: When resuming a session, the system doesn't verify that the group parameter in the URL matches the participant's assigned group in the database.

**Risk**: 
- User could manipulate URL to view different group's content
- Data inconsistency between participant assignment and actual quiz viewed
- Corrupted experimental data

**Current Code**:
```typescript
const checkSessionRes = await fetch(`/api/sessions/resume?participant_id=${humanId}`);
// Returns session without checking group assignment
```

**Fix Required**: 
1. Fetch participant data to get `assigned_group`
2. Compare URL `group` param with `assigned_group` from database
3. Redirect or show error if mismatch

---

### **Issue #2: Missing Group Field in Responses Table** ❌
**Location**: `src/lib/supabase-api.ts`, `/api/responses/route.ts`

**Problem**: Responses are saved without the `group` field, making it impossible to identify which experimental condition a response belongs to.

**Risk**:
- Cannot analyze data by group
- Cannot verify data integrity across groups
- Post-hoc analysis will require joining multiple tables

**Current Schema**:
```typescript
export type Response = {
  participant_id: string;
  session_id: string;
  question_id: string;
  category: string;  // ✅ Has category
  answer: string;
  is_correct: boolean;
  reaction_time: number;
  // ❌ MISSING: group field
}
```

**Fix Required**:
1. Add `group INTEGER NOT NULL` column to `responses` table in Supabase
2. Update `Response` type definition
3. Pass `group` when saving responses
4. Update all API calls to include group

---

### **Issue #3: Session Not Storing Group Assignment** ❌
**Location**: `src/app/[humanId]/page.tsx` (Line 112-126), `src/lib/supabase-api.ts`

**Problem**: When creating a new session, the group assignment is not stored with the session data.

**Risk**:
- Cannot identify which group a session belongs to
- Resume functionality lacks group validation
- Analytics will be incomplete

**Current Code**:
```typescript
const sessionRes = await fetch('/api/sessions', {
  method: 'POST',
  body: JSON.stringify({
    participant_id: humanId,
    total_questions: questions.length,
    assignment_json: questionIds,
    category_map: categoryMap,
    // ❌ MISSING: group field
  })
});
```

**Fix Required**:
1. Add `assigned_group INTEGER` column to `sessions` table
2. Update `Session` type definition
3. Pass group when creating session
4. Update session retrieval to return group

---

### **Issue #4: No Group Validation on Participant Creation** ⚠️
**Location**: `src/app/api/participants/route.ts`

**Problem**: While group validation exists (checks 1-6), there's no verification that the group matches config's `supported_groups`.

**Risk**:
- User could be assigned to unsupported group
- Config says groups [1, 4] but API allows all 1-6

**Current Code**:
```typescript
if (assigned_group < 1 || assigned_group > 6) {
  return NextResponse.json(
    { error: "Invalid group. Must be between 1 and 6" },
    { status: 400 }
  );
}
```

**Fix Required**:
1. Import config in API route
2. Check against `config.supported_groups`
3. Return error if group not supported

---

## ✅ Implementation Plan

### Step 1: Update Database Schema

#### A. Add `assigned_group` to `sessions` table
```sql
-- Add column to sessions table
ALTER TABLE sessions 
ADD COLUMN assigned_group INTEGER NOT NULL DEFAULT 1 
CHECK (assigned_group BETWEEN 1 AND 6);

-- Add index for analytics
CREATE INDEX idx_sessions_assigned_group ON sessions(assigned_group);

-- Add comment
COMMENT ON COLUMN sessions.assigned_group IS 'Experimental group (1-6) assigned to this session';
```

#### B. Add `group` to `responses` table
```sql
-- Add column to responses table
ALTER TABLE responses 
ADD COLUMN assigned_group INTEGER NOT NULL DEFAULT 1 
CHECK (assigned_group BETWEEN 1 AND 6);

-- Add index for analytics
CREATE INDEX idx_responses_assigned_group ON responses(assigned_group);

-- Add comment
COMMENT ON COLUMN responses.assigned_group IS 'Experimental group (1-6) for this response';
```

---

### Step 2: Update TypeScript Types

**File**: `src/lib/supabase-api.ts`

```typescript
export type Session = {
  id?: string;
  participant_id: string;
  assigned_group: number;  // ← ADD THIS
  total_questions?: number;
  assignment_json?: string;
  category_map?: string;
  progress?: number;
  current_index?: number;
  completed?: boolean;
  started_at?: string;
  last_activity_at?: string;
};

export type Response = {
  id?: number;
  participant_id: string;
  session_id: string;
  question_id: string;
  category: string;
  assigned_group: number;  // ← ADD THIS
  answer: string;
  is_correct?: boolean;
  reaction_time?: number;
  question_number?: number;
  mouse_data_json?: string | null;
  created_at?: string;
};
```

---

### Step 3: Update Session Creation

**File**: `src/app/[humanId]/page.tsx`

```typescript
// When creating new session (around line 112)
const sessionRes = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: humanId,
    assigned_group: group,  // ← ADD THIS
    total_questions: questions.length,
    assignment_json: questionIds,
    category_map: categoryMap,
  })
});
```

---

### Step 4: Update Response Saving

**File**: `src/app/[humanId]/page.tsx`

```typescript
// When saving response (around line 220)
const response = await fetch('/api/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: humanId,
    session_id: sessionId,
    question_id: question.id,
    category: question.category,
    assigned_group: group,  // ← ADD THIS
    answer,
    is_correct: isCorrect,
    reaction_time: reactionTime,
    question_number: index + 1,
  })
});
```

---

### Step 5: Add Group Verification on Resume

**File**: `src/app/[humanId]/page.tsx`

Add this check after resuming session:

```typescript
if (resumedSession) {
  // ← ADD GROUP VERIFICATION
  // Fetch participant to verify group assignment
  const participantRes = await fetch(`/api/participants?participant_id=${humanId}`);
  if (participantRes.ok) {
    const participantData = await participantRes.json();
    const assignedGroup = participantData.data?.assigned_group;
    
    if (assignedGroup && assignedGroup !== group) {
      console.error(
        `❌ Group mismatch: URL has group ${group}, but participant assigned to group ${assignedGroup}`
      );
      setError(
        `Group mismatch detected. You are assigned to group ${assignedGroup}. ` +
        `Redirecting...`
      );
      
      // Redirect to correct group URL
      window.location.href = `/${humanId}?group=${assignedGroup}`;
      return;
    }
  }
  
  // Also verify session's assigned_group matches
  if (resumedSession.assigned_group !== group) {
    console.error(
      `❌ Session group mismatch: URL has group ${group}, ` +
      `but session has group ${resumedSession.assigned_group}`
    );
    setError('Session group mismatch. Please contact administrator.');
    return;
  }
  
  // Resume existing session
  currentSessionId = resumedSession.id;
  setSessionId(currentSessionId);
  setIsResumed(true);
  // ... rest of resume logic
}
```

---

### Step 6: Add Config Validation

**File**: `src/app/api/participants/route.ts`

```typescript
import config from '@/lib/config';  // ← ADD IMPORT

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participant_id, assigned_group, ... } = body;

    // Validate required fields
    if (!participant_id || !assigned_group) {
      return NextResponse.json(
        { error: "Missing required fields: participant_id, assigned_group" },
        { status: 400 }
      );
    }

    // ← UPDATE VALIDATION TO USE CONFIG
    if (!config.supported_groups.includes(assigned_group)) {
      return NextResponse.json(
        { 
          error: `Invalid group ${assigned_group}. Supported groups: ${config.supported_groups.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // ... rest of code
  }
}
```

---

## 🧪 Testing Checklist

### Test 1: Group Assignment Consistency
- [ ] Create participant with group 1
- [ ] Verify `participants.assigned_group = 1`
- [ ] Start quiz with `?group=1`
- [ ] Verify `sessions.assigned_group = 1`
- [ ] Answer question
- [ ] Verify `responses.assigned_group = 1`
- [ ] Try accessing with `?group=4` → Should redirect to `?group=1`

### Test 2: Session Resume with Group Verification
- [ ] Start session with group 1 (answer 5 questions)
- [ ] Close browser
- [ ] Reopen with same `?group=1` → Should resume
- [ ] Try with `?group=4` → Should redirect to `?group=1`

### Test 3: Invalid Group Prevention
- [ ] Try creating participant with group 7 → Should fail
- [ ] Try with group 2 (if not in supported_groups) → Should fail
- [ ] Try with group 1 (if in supported_groups) → Should succeed

### Test 4: Data Integrity
- [ ] Complete full quiz for participant_001 in group 1
- [ ] Check Supabase `responses` table:
  ```sql
  SELECT DISTINCT assigned_group 
  FROM responses 
  WHERE participant_id = 'participant_001';
  -- Should return only: 1
  ```
- [ ] Verify session:
  ```sql
  SELECT assigned_group, completed 
  FROM sessions 
  WHERE participant_id = 'participant_001';
  -- Should show: assigned_group=1, completed=true
  ```

---

## 📊 Data Analysis Queries (After Fixes)

### Group Distribution
```sql
SELECT assigned_group, COUNT(*) as participants
FROM participants
GROUP BY assigned_group
ORDER BY assigned_group;
```

### Response Rate by Group
```sql
SELECT 
  p.assigned_group,
  COUNT(DISTINCT p.participant_id) as total_participants,
  COUNT(r.id) as total_responses,
  ROUND(AVG(r.reaction_time), 2) as avg_reaction_time,
  ROUND(AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END)::numeric * 100, 2) as accuracy_pct
FROM participants p
LEFT JOIN responses r ON p.participant_id = r.participant_id
GROUP BY p.assigned_group
ORDER BY p.assigned_group;
```

### Session Completion by Group
```sql
SELECT 
  assigned_group,
  COUNT(*) as total_sessions,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_sessions,
  ROUND(AVG(current_index::float / total_questions * 100), 2) as avg_progress_pct
FROM sessions
GROUP BY assigned_group
ORDER BY assigned_group;
```

---

## 🚨 Migration Notes

### For Existing Data

If you already have data in production:

1. **Backup first!**
   ```sql
   -- In Supabase SQL Editor
   CREATE TABLE participants_backup AS SELECT * FROM participants;
   CREATE TABLE sessions_backup AS SELECT * FROM sessions;
   CREATE TABLE responses_backup AS SELECT * FROM responses;
   ```

2. **Add columns with defaults**
   ```sql
   -- This allows existing records to get default value
   ALTER TABLE sessions 
   ADD COLUMN assigned_group INTEGER NOT NULL DEFAULT 1;
   
   ALTER TABLE responses 
   ADD COLUMN assigned_group INTEGER NOT NULL DEFAULT 1;
   ```

3. **Update existing records** (if you know the correct groups)
   ```sql
   -- Update sessions based on participant assignment
   UPDATE sessions s
   SET assigned_group = p.assigned_group
   FROM participants p
   WHERE s.participant_id = p.participant_id;
   
   -- Update responses based on session assignment
   UPDATE responses r
   SET assigned_group = s.assigned_group
   FROM sessions s
   WHERE r.session_id = s.id;
   ```

4. **Verify migration**
   ```sql
   -- Check for any nulls or mismatches
   SELECT COUNT(*) FROM sessions WHERE assigned_group IS NULL;
   SELECT COUNT(*) FROM responses WHERE assigned_group IS NULL;
   
   -- Verify consistency
   SELECT 
     r.participant_id,
     p.assigned_group as participant_group,
     s.assigned_group as session_group,
     r.assigned_group as response_group
   FROM responses r
   JOIN participants p ON r.participant_id = p.participant_id
   JOIN sessions s ON r.session_id = s.id
   WHERE p.assigned_group != s.assigned_group 
      OR s.assigned_group != r.assigned_group;
   -- Should return 0 rows
   ```

---

## 📋 Deployment Steps

1. **Update Supabase Schema** (5 min)
   - Run SQL migrations in Supabase SQL Editor
   - Verify columns added with `\d sessions` and `\d responses`

2. **Update Code** (15 min)
   - Update type definitions
   - Update API routes
   - Update page component
   - Run type check: `npm run type-check`

3. **Test Locally** (20 min)
   - Follow testing checklist above
   - Verify all scenarios work

4. **Deploy** (5 min)
   - Push to repository
   - Deploy to Vercel/production

5. **Verify Production** (10 min)
   - Test with real participant ID
   - Check Supabase data
   - Monitor logs for errors

---

## 🎯 Priority Level

**CRITICAL** - Must be fixed before production rollout

**Why?**:
1. Data integrity issues can corrupt entire experiment
2. Group manipulation risk invalidates results
3. Missing group field makes analysis impossible
4. Cannot be fixed retroactively without manual data cleanup

**Estimated Time**: 1-2 hours total
- Schema updates: 15 min
- Code changes: 30 min
- Testing: 30-45 min
- Deployment: 15 min

---

## ✅ Sign-off Checklist

Before rolling out to production:

- [ ] Database schema updated with `assigned_group` columns
- [ ] TypeScript types updated
- [ ] Session creation includes group
- [ ] Response saving includes group
- [ ] Group verification on resume implemented
- [ ] Config validation in participant API
- [ ] All tests pass
- [ ] Test data verified in Supabase
- [ ] Production deployment successful
- [ ] Post-deployment verification complete

---

**Document Created**: December 17, 2025  
**Last Updated**: December 17, 2025  
**Status**: Ready for Implementation
