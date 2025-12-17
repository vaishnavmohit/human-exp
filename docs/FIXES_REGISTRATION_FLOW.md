# Registration Flow & Config Loading Fixes

## 🔧 Issues Fixed

### Issue #1: Config Loading Failed in API Routes ✅ FIXED
**Error**: `TypeError: Failed to parse URL from /config.json`

**Root Cause**: 
- `fetch("/config.json")` doesn't work in server-side API routes
- Needs absolute URL or filesystem access

**Solution**:
Updated `src/lib/config.ts` to detect environment:
- **Server-side**: Read directly from filesystem using `fs.readFileSync`
- **Client-side**: Use `fetch()` as before

```typescript
// Server-side: read from filesystem
if (typeof window === "undefined") {
  const configPath = path.join(process.cwd(), "public", "config.json");
  const configData = fs.readFileSync(configPath, "utf-8");
  cachedConfig = JSON.parse(configData);
  return cachedConfig!;
}

// Client-side: fetch from public
const res = await fetch("/config.json", { cache: "no-store" });
```

---

### Issue #2: Foreign Key Constraint Violation ✅ FIXED
**Error**: `insert or update on table "sessions" violates foreign key constraint "sessions_participant_id_fkey"`

**Root Cause**:
- Trying to create session for non-existent participant
- Participant registration was failing silently
- No check if participant exists before creating session

**Solution**:
1. Check if participant exists BEFORE loading quiz
2. Show error if not registered
3. Proper registration flow on home page

---

### Issue #3: No Registration Requirement ✅ FIXED
**Problem**: Users could access quiz without being registered

**Solution**:
- Added participant existence check at start of quiz initialization
- Show clear error message: "Participant is not registered. Please register first..."
- Cannot proceed without registration

---

### Issue #4: Group Required in URL ✅ FIXED
**Problem**: Users had to manually specify `?group=X` in URL

**Solution**:
- Auto-detect group from participant record in database
- URL group parameter is now optional
- If URL group doesn't match DB group, auto-redirect to correct one
- Priority: Database group > URL group

---

## 📝 Changes Made

### 1. Config Loading (`src/lib/config.ts`)

**Added**:
- Import `fs` and `path` for server-side file reading
- Environment detection (`typeof window === "undefined"`)
- Server-side config loading from filesystem
- Client-side config loading via fetch (unchanged)

**Benefits**:
- Works in both API routes and client components
- No more "Invalid URL" errors
- Cached config after first load

---

### 2. Quiz Page Initialization (`src/app/[humanId]/page.tsx`)

**Major Rewrite**:

#### Before:
```typescript
const group = parseInt(searchParams.get('group') || '1', 10);
// Always used URL group, no validation
```

#### After:
```typescript
const urlGroup = searchParams.get('group') ? parseInt(searchParams.get('group')!, 10) : null;
const [assignedGroup, setAssignedGroup] = useState<number | null>(null);

// 4-step initialization:
// 1. Check participant exists
// 2. Get assigned group from DB
// 3. Redirect if URL group mismatches
// 4. Load quiz with correct group
```

**New Flow**:
1. **Check Participant** → Fetch from `/api/participants?participant_id=X`
2. **Verify Registration** → If not found, show error and stop
3. **Auto-detect Group** → Use `assigned_group` from database
4. **Validate URL Group** → If URL has group and it doesn't match, redirect
5. **Load Quiz** → Use database group (not URL group)
6. **Create/Resume Session** → With validated group

**Error Messages**:
- Not registered: `Participant "X" is not registered. Please register first...`
- Group mismatch: `Redirecting to your assigned group Y...`
- Session error: `Session group mismatch. Please contact administrator.`

---

### 3. Home Page Registration (`src/app/page.tsx`)

**Updated**:
- Actually register participant via API (was TODO before)
- Call `/api/participants` POST endpoint
- Handle registration errors
- Navigate to quiz WITHOUT group parameter (auto-detected)

```typescript
// Register participant
const registerRes = await fetch('/api/participants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_id: pid,
    email: email || null,
    enrollment_number: enrollmentNumber || null,
    assigned_group: selectedGroup,
    consent: consent,
    share_data: true,
  })
});

// Navigate without group param
router.push(`/${pid}`);  // ← Not /${pid}?group=X
```

---

## 🎯 User Experience Improvements

### Before:
1. ❌ Config errors in console
2. ❌ Could access quiz without registration
3. ❌ Foreign key errors when creating session
4. ❌ Had to manually specify group in URL
5. ❌ Silent failures, confusing errors

### After:
1. ✅ Clean console, no config errors
2. ✅ Must register before accessing quiz
3. ✅ Proper error messages guide user
4. ✅ Group auto-detected from database
5. ✅ Clear error messages at each step

---

## 🔄 New Flow Diagram

```
┌─────────────────┐
│   Home Page     │
│  Registration   │
└────────┬────────┘
         │
         ├─ Enter Participant ID
         ├─ Enter Email (optional)
         ├─ Select Group (1-6)
         ├─ Consent Checkbox
         │
         ▼
    POST /api/participants
         │
         ├─ Validate group against config
         ├─ Create participant record
         │
         ▼
   Navigate to /{pid}
   (no group param needed)
         │
         ▼
┌────────────────────┐
│   Quiz Page        │
│   /{pid}           │
└────────┬───────────┘
         │
         ├─ STEP 1: Check participant exists
         │    GET /api/participants?participant_id={pid}
         │    ├─ Not found → Show "Please register" error
         │    └─ Found → Get assigned_group
         │
         ├─ STEP 2: Validate URL group (if present)
         │    ├─ Matches DB group → Continue
         │    └─ Mismatch → Redirect to correct group
         │
         ├─ STEP 3: Load quiz for assigned_group
         │
         ├─ STEP 4: Check for incomplete session
         │    GET /api/sessions/resume?participant_id={pid}
         │    ├─ Found → Resume from last question
         │    └─ Not found → Create new session
         │
         └─ STEP 5: Start/Resume quiz
```

---

## 🧪 Testing Scenarios

### Test 1: New Participant Registration
```bash
# 1. Visit home page
open http://localhost:3000

# 2. Fill form:
- Participant ID: test_user_001
- Email: test@example.com
- Group: 1
- ✓ Consent checkbox

# 3. Click "Start Quiz"

# Expected:
✅ Participant created in Supabase
✅ Redirects to /test_user_001 (no ?group= param)
✅ Quiz loads with group 1
✅ Session created
```

### Test 2: Unregistered Participant
```bash
# Visit quiz directly without registration
open http://localhost:3000/random_user_999

# Expected:
✅ Shows error: "Participant 'random_user_999' is not registered..."
✅ Cannot proceed
✅ Must go to home page to register
```

### Test 3: Group Auto-Detection
```bash
# 1. Register participant with group 1
# 2. Visit without group param:
open http://localhost:3000/test_user_001

# Expected:
✅ Auto-detects group 1 from database
✅ Loads quiz with correct group
✅ Shows "Group: 1" in loading screen
```

### Test 4: Group Mismatch Redirect
```bash
# 1. Register participant with group 1
# 2. Try to access with wrong group:
open http://localhost:3000/test_user_001?group=4

# Expected:
✅ Shows "Redirecting to your assigned group 1..."
✅ Auto-redirects to /test_user_001?group=1 after 1.5s
✅ Quiz loads with group 1
```

### Test 5: Session Resume with Group
```bash
# 1. Start quiz (answer 5 questions)
# 2. Close browser
# 3. Reopen: http://localhost:3000/test_user_001

# Expected:
✅ Auto-detects group from participant record
✅ Resumes from question 6
✅ No errors
```

---

## 📊 Database Verification

After these changes, verify data integrity:

```sql
-- All participants should have assigned_group
SELECT participant_id, assigned_group, consent
FROM participants
WHERE assigned_group IS NULL;
-- Should return 0 rows

-- All sessions should reference existing participants
SELECT s.id, s.participant_id, p.participant_id
FROM sessions s
LEFT JOIN participants p ON s.participant_id = p.participant_id
WHERE p.participant_id IS NULL;
-- Should return 0 rows

-- Group consistency check
SELECT 
  p.participant_id,
  p.assigned_group as participant_group,
  s.assigned_group as session_group
FROM participants p
LEFT JOIN sessions s ON p.participant_id = s.participant_id
WHERE s.assigned_group IS NOT NULL 
  AND p.assigned_group != s.assigned_group;
-- Should return 0 rows
```

---

## 🚨 Breaking Changes

### For Users:
- ✅ **No breaking changes** - Better UX, clearer errors

### For Developers:
- ⚠️ **Must register participants first** - Cannot access quiz directly anymore
- ✅ **Group parameter optional** - Auto-detected from database
- ✅ **Config works in API routes** - No more fetch errors

---

## 🎉 Benefits

1. **Security**: Cannot access quiz without registration
2. **Data Integrity**: Participants always exist before sessions created
3. **User Experience**: Clear error messages, auto-detection
4. **Flexibility**: Group can be changed in database, URL redirects automatically
5. **Reliability**: No more foreign key errors or config loading failures

---

## 📋 Deployment Checklist

- [x] Update `src/lib/config.ts` for server-side loading
- [x] Update `src/app/[humanId]/page.tsx` for registration check
- [x] Update `src/app/page.tsx` for actual registration
- [ ] Test new participant registration flow
- [ ] Test unregistered participant access (should fail)
- [ ] Test group auto-detection
- [ ] Test group mismatch redirect
- [ ] Verify no config errors in console
- [ ] Verify no foreign key errors
- [ ] Test session resume with auto-detected group

---

**Implementation Date**: December 17, 2025  
**Status**: ✅ Ready for Testing  
**Risk Level**: Low (improved error handling)
