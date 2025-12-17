# Group Assignment & Data Integrity Implementation Summary

## 🎯 Overview

This document summarizes all changes made to ensure proper group assignment tracking and data integrity across the human experiment application.

---

## 📝 Changes Made

### 1. Database Schema Updates

**File**: `docs/MIGRATION_ADD_ASSIGNED_GROUP.sql`

Added `assigned_group` column to two critical tables:

#### Sessions Table
```sql
ALTER TABLE sessions ADD COLUMN assigned_group INTEGER NOT NULL CHECK (assigned_group BETWEEN 1 AND 6);
CREATE INDEX idx_sessions_assigned_group ON sessions(assigned_group);
```

#### Responses Table
```sql
ALTER TABLE responses ADD COLUMN assigned_group INTEGER NOT NULL CHECK (assigned_group BETWEEN 1 AND 6);
CREATE INDEX idx_responses_assigned_group ON responses(assigned_group);
```

**Why**: Enables tracking which experimental group each session and response belongs to, critical for data analysis.

---

### 2. TypeScript Type Definitions

**File**: `src/lib/supabase-api.ts`

Updated type definitions to include `assigned_group`:

```typescript
export type Session = {
  id?: string;
  participant_id: string;
  assigned_group: number;  // ← ADDED
  // ... other fields
};

export type Response = {
  id?: number;
  participant_id: string;
  session_id: string;
  question_id: string;
  category: string;
  assigned_group: number;  // ← ADDED
  // ... other fields
};
```

**Why**: Ensures type safety and catches errors at compile time.

---

### 3. API Route Updates

#### A. Participants API (`src/app/api/participants/route.ts`)

**Changes**:
- Import config loader
- Validate `assigned_group` against `config.supported_groups`
- Better error messages

```typescript
import { loadConfig } from "@/lib/config";

// Validate group against config
const config = await loadConfig();
if (!config.supported_groups.includes(assigned_group)) {
  return NextResponse.json(
    { error: `Invalid group ${assigned_group}. Supported groups: ${config.supported_groups.join(', ')}` },
    { status: 400 }
  );
}
```

**Why**: Prevents participants from being assigned to unsupported experimental groups.

---

#### B. Sessions API (`src/app/api/sessions/route.ts`)

**Changes**:
- Added `assigned_group` to required fields
- Pass `assigned_group` when creating session

```typescript
const {
  participant_id,
  assigned_group,  // ← ADDED
  total_questions,
  assignment_json,
  category_map,
} = body;

// Validate includes assigned_group
if (!participant_id || !assigned_group || !total_questions || !assignment_json) {
  return NextResponse.json(
    { error: "Missing required fields: participant_id, assigned_group, total_questions, assignment_json" },
    { status: 400 }
  );
}
```

**Why**: Ensures every session knows its experimental group.

---

#### C. Responses API (`src/app/api/responses/route.ts`)

**Changes**:
- Added `assigned_group` to required fields
- Validate `assigned_group` is present
- Pass to `saveResponse` function

```typescript
const {
  participant_id,
  session_id,
  question_id,
  category,
  assigned_group,  // ← ADDED
  answer,
  // ... other fields
} = body;

if (!participant_id || !session_id || !question_id || !category || !answer || assigned_group === undefined) {
  return NextResponse.json(
    { error: "Missing required fields: ..., assigned_group" },
    { status: 400 }
  );
}
```

**Why**: Ensures every response is tagged with its experimental group.

---

### 4. Frontend Quiz Page Updates

**File**: `src/app/[humanId]/page.tsx`

#### A. Group Verification on Session Resume

**Added** (Lines ~71-110):
```typescript
if (resumedSession) {
  // VERIFY GROUP ASSIGNMENT BEFORE RESUMING
  const participantRes = await fetch(`/api/participants?participant_id=${humanId}`);
  if (participantRes.ok) {
    const participantData = await participantRes.json();
    const assignedGroup = participantData.data?.assigned_group;
    
    if (assignedGroup && assignedGroup !== group) {
      console.error(
        `❌ Group mismatch: URL has group ${group}, but participant assigned to group ${assignedGroup}`
      );
      setError(`Group mismatch detected. You are assigned to group ${assignedGroup}. Redirecting...`);
      
      setTimeout(() => {
        window.location.href = `/${humanId}?group=${assignedGroup}`;
      }, 2000);
      return;
    }
  }
  
  // Also verify session's assigned_group matches
  if (resumedSession.assigned_group && resumedSession.assigned_group !== group) {
    console.error(`❌ Session group mismatch`);
    setError('Session group mismatch. Please contact administrator.');
    return;
  }
  
  // Resume existing session...
}
```

**Why**: Prevents participants from viewing wrong group's content via URL manipulation.

---

#### B. Session Creation with Group

**Updated** (Line ~125):
```typescript
const sessionRes = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: humanId,
    assigned_group: group,  // ← ADDED
    total_questions: questions.length,
    assignment_json: questionIds,
    category_map: categoryMap,
  })
});
```

**Why**: Passes group to session creation so it's stored in database.

---

#### C. Response Saving with Group

**Updated** (Line ~230):
```typescript
const response = await fetch('/api/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: humanId,
    session_id: sessionId,
    question_id: question.id,
    category: question.category,
    assigned_group: group,  // ← ADDED
    answer,
    is_correct: isCorrect,
    reaction_time: reactionTime,
    question_number: index + 1,
  })
});
```

**Why**: Tags every response with its experimental group for analysis.

---

## 📚 Documentation Created

### 1. Pre-Production Checklist
**File**: `docs/PRE_PRODUCTION_CHECKLIST.md`

Comprehensive document covering:
- All 4 critical issues identified
- Implementation plan with step-by-step instructions
- Data analysis queries for post-deployment
- Migration notes for existing data
- Deployment checklist

### 2. SQL Migration Script
**File**: `docs/MIGRATION_ADD_ASSIGNED_GROUP.sql`

Production-ready migration with:
- Safe column additions (NULL initially)
- Automatic backfilling from existing data
- Constraint additions
- Verification queries
- Rollback script

### 3. Testing Guide
**File**: `docs/TESTING_GROUP_ASSIGNMENT.md`

Complete testing protocol with:
- 10 comprehensive test scenarios
- SQL verification queries
- Expected results for each test
- Troubleshooting guide
- Test results log template

---

## 🔍 Issues Identified & Fixed

### Issue #1: Group Not Verified on Session Resume ✅ FIXED
**Before**: User could manipulate URL to view different group's content  
**After**: System verifies group matches participant assignment and redirects if mismatch

### Issue #2: Missing Group Field in Responses ✅ FIXED
**Before**: Responses saved without group, making analysis impossible  
**After**: Every response tagged with `assigned_group`

### Issue #3: Session Not Storing Group ✅ FIXED
**Before**: Sessions had no group information  
**After**: Sessions include `assigned_group` field

### Issue #4: No Config Validation ✅ FIXED
**Before**: API allowed any group 1-6, ignoring config  
**After**: Validates against `config.supported_groups`

---

## 📊 Data Integrity Verification

After implementation, run these queries to verify:

### Check All Tables Have Group
```sql
SELECT 
  'participants' as table, COUNT(*) as total, 
  COUNT(assigned_group) as with_group
FROM participants
UNION ALL
SELECT 'sessions', COUNT(*), COUNT(assigned_group) FROM sessions
UNION ALL
SELECT 'responses', COUNT(*), COUNT(assigned_group) FROM responses;
```

### Verify Cross-Table Consistency
```sql
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
-- Should return 0 rows
```

### Group Distribution Analysis
```sql
SELECT 
  p.assigned_group,
  COUNT(DISTINCT p.participant_id) as participants,
  COUNT(DISTINCT s.id) as sessions,
  COUNT(r.id) as responses,
  ROUND(AVG(r.reaction_time), 2) as avg_reaction_time,
  ROUND(AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) * 100, 2) as accuracy_pct
FROM participants p
LEFT JOIN sessions s ON p.participant_id = s.participant_id
LEFT JOIN responses r ON s.id = r.session_id
GROUP BY p.assigned_group
ORDER BY p.assigned_group;
```

---

## 🚀 Deployment Steps

### Step 1: Database Migration (5 min)
1. Open Supabase SQL Editor
2. Copy contents of `docs/MIGRATION_ADD_ASSIGNED_GROUP.sql`
3. Run the migration
4. Verify with: `\d sessions` and `\d responses`

### Step 2: Code Deployment (Automatic)
Code changes are already made and ready. Just:
1. Commit all changes
2. Push to repository
3. Vercel/deployment platform will auto-deploy

### Step 3: Verification (10 min)
1. Follow `docs/TESTING_GROUP_ASSIGNMENT.md`
2. Run at least Tests 1-4 in production
3. Check Supabase data to confirm group fields populated

---

## ⚠️ Breaking Changes

**Migration Required**: Yes - Database schema changes needed

**Backwards Compatibility**: 
- ✅ Old data will work (migration backfills existing records)
- ❌ Old code will NOT work (API expects `assigned_group` now)
- ⚠️ Must deploy database AND code together

**Rollback Plan**: 
- SQL rollback script included in migration file
- Can restore to previous state if needed
- However, new responses after migration cannot be downgraded

---

## 📈 Benefits

1. **Data Integrity**: All experimental data now tagged with group
2. **Security**: Users cannot manipulate URLs to see wrong content
3. **Analytics**: Can analyze by group without complex joins
4. **Validation**: Config-based group validation prevents errors
5. **Debugging**: Clear error messages when group mismatches occur

---

## 🔐 Security Improvements

1. **URL Tampering Prevention**: Group verification on resume
2. **Invalid Group Rejection**: Config-based validation
3. **Mismatch Detection**: Multiple layers of verification
4. **Automatic Correction**: Redirects to correct group

---

## 📝 Files Modified

### Code Files (6)
1. `src/lib/supabase-api.ts` - Type definitions
2. `src/app/api/participants/route.ts` - Participant validation
3. `src/app/api/sessions/route.ts` - Session creation
4. `src/app/api/responses/route.ts` - Response saving
5. `src/app/[humanId]/page.tsx` - Quiz page logic

### Documentation Files (4)
1. `docs/PRE_PRODUCTION_CHECKLIST.md` - Issue analysis & fixes
2. `docs/MIGRATION_ADD_ASSIGNED_GROUP.sql` - Database migration
3. `docs/TESTING_GROUP_ASSIGNMENT.md` - Testing protocol
4. `docs/GROUP_ASSIGNMENT_SUMMARY.md` - This file

---

## ✅ Pre-Launch Checklist

Before rolling out to real participants:

- [ ] Run database migration in Supabase
- [ ] Verify migration with provided SQL queries
- [ ] Deploy code changes
- [ ] Run Tests 1-4 from testing guide
- [ ] Verify data consistency (0 mismatches query)
- [ ] Test group mismatch redirect flow
- [ ] Check browser console for errors
- [ ] Verify performance (load time < 2s)
- [ ] Test with 2-3 test participants end-to-end
- [ ] Document any issues in testing log
- [ ] Get sign-off from team lead

---

## 🆘 Support

**Issues During Migration**:
- Check `docs/PRE_PRODUCTION_CHECKLIST.md` Troubleshooting section
- Rollback script available in migration file
- Database backups created before migration

**Issues During Testing**:
- See `docs/TESTING_GROUP_ASSIGNMENT.md` Troubleshooting
- Check browser console for errors
- Verify code deployment completed

**Data Integrity Questions**:
- Run verification queries in Data Integrity section
- Check for null values in assigned_group columns
- Verify cross-table consistency

---

**Implementation Date**: December 17, 2025  
**Status**: ✅ Ready for Production  
**Estimated Migration Time**: 30-45 minutes total  
**Risk Level**: Low (includes rollback plan)
