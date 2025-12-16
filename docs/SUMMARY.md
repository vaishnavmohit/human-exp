# Implementation Summary: Multi-Category Config System

## ✅ What Was Implemented

### 1. Configuration System (`public/config.json`)
- **Purpose**: Central configuration for quiz behavior
- **Key Settings**:
  - `n_per_category: 10` - Sample 10 questions per category
  - `randomize_assignment: false` - Deterministic assignment (same ID = same questions)
  - `shuffle_categories: true` - Mix questions from all categories
  - `metadata_files` - Paths to 4 category JSON files (ff, bd, hd_novel, hd_comb)
  - `category_order` - Defines processing order: FF → BD → HD Novel → HD Comb
  - `supported_groups: [1, 4]` - Only visual groups supported currently

### 2. Enhanced Type System (`src/lib/types.ts`)
- Added `AppConfig` type for configuration
- Added `category` field to `QuizQuestion`
- Updated `BongardRawItem` to include optional category

### 3. Config Loader (`src/lib/config.ts`)
New utility functions:
- `loadConfig()` - Fetch and cache configuration
- `createSeededRandom(seed)` - Generate deterministic RNG from humanId
- `shuffleArray(array, rng)` - Shuffle with optional seeded RNG

### 4. Multi-Category Quiz Loader (`src/lib/load-quiz.ts`)
**Complete rewrite** to support:
- Load all 4 categories (FF, BD, HD Novel, HD Comb)
- Per-category sampling (n_per_category)
- Deterministic vs random assignment
- Category-level and cross-category shuffling
- Group validation (groups 1 & 4)

**New function signature:**
```typescript
loadQuiz(humanId: string, group: number = 1): Promise<QuizQuestion[]>
```

### 5. Updated Quiz Page (`src/app/[humanId]/page.tsx`)
- Reads `group` from URL query params
- Passes `humanId` and `group` to `loadQuiz()`
- Shows loading/error states
- Displays completion message when done

### 6. Documentation
- Created `IMPLEMENTATION_GUIDE.md` with full usage instructions
- Added testing utilities in `src/lib/test-utils.ts`

## 🎯 How It Works

### Question Flow (Example with config defaults)

```
1. Load config.json
   ├─ n_per_category = 10
   ├─ randomize_assignment = false
   └─ shuffle_categories = true

2. For each category in order [ff, bd, hd_novel, hd_comb]:
   ├─ Load metadata file (500 items)
   ├─ Create seed from humanId ("participant_001")
   ├─ Shuffle deterministically using seed
   ├─ Take first 10 items
   └─ Add to questions array

3. Result: 40 questions (10 from each category)

4. Shuffle all 40 questions deterministically (using same seed)

5. Return questions in final order
```

### Deterministic Assignment Example

**Participant: "alice@example.com"**
```
Seed: "alice@example.com"
→ Hash: 12345678 (numeric)
→ RNG state initialized

FF:  Shuffle 500 items → [234, 12, 456, ...] → Take 10
BD:  Shuffle 500 items → [89, 301, 77, ...]  → Take 10
HD_N: Shuffle 500 items → [445, 23, 198, ...] → Take 10
HD_C: Shuffle 500 items → [156, 389, 44, ...] → Take 10

Total: 40 questions
Final shuffle: [BD_3, FF_1, HD_N_5, FF_7, ...]

EVERY time "alice@example.com" loads → SAME 40 questions in SAME order
```

### Random Assignment Example

If `randomize_assignment: true`:
- Uses `Math.random()` instead of seeded RNG
- Same participant gets different questions each session
- Useful for practice/testing, not for actual experiments

## 📊 Current Configuration

```json
{
  "n_per_category": 10,           // 10 questions × 4 categories = 40 total
  "randomize_assignment": false,   // Deterministic (same ID = same Qs)
  "shuffle_categories": true,      // Mix all categories together
  "category_order": ["ff", "bd", "hd_novel", "hd_comb"]
}
```

**Result**: Each participant gets 40 questions (10 FF, 10 BD, 10 HD Novel, 10 HD Comb) in a shuffled but deterministic order.

## 🔄 Comparison with Flask App

| Feature | Flask App | Next.js App |
|---------|-----------|-------------|
| **Categories** | 4 (ff, bd, hd_novel, hd_comb) | ✅ Same |
| **n_per_category** | Configurable via config.json | ✅ Same |
| **Deterministic** | Based on email/enrollment | ✅ Based on humanId |
| **Shuffling** | Per-category + cross-category | ✅ Same |
| **Groups** | 1-6 (visual, symbolic, language) | Only 1 & 4 (visual) |
| **Image Serving** | Custom Flask routes | Next.js static serving |
| **Database** | SQLite | ❌ Not yet implemented |

## 🧪 Testing the Implementation

### Test in Browser Console

```javascript
// Load testing utilities
// Then run:

await quizTest.validateConfig()
// Checks config file and metadata

await quizTest.testQuizLoading()
// Tests multiple participants and groups

await quizTest.analyzeDistribution('participant_001', 1)
// Shows category breakdown

await quizTest.compareParticipants('p1', 'p2')
// Checks overlap and order differences
```

### Test via URL

```bash
# Test participant with group 1 (no concept shown)
http://localhost:3000/test_participant_001?group=1

# Test participant with group 4 (concept shown)
http://localhost:3000/test_participant_001?group=4

# Same participant should get same questions
http://localhost:3000/alice@example.com?group=1
# Reload → same questions in same order (if randomize_assignment=false)
```

## 🎨 Example Scenarios

### Scenario 1: Small Pilot Study
```json
{
  "n_per_category": 5,
  "randomize_assignment": false,
  "shuffle_categories": false
}
```
- 20 questions total (5 per category)
- Questions stay in category order: FF, BD, HD Novel, HD Comb
- Same participant always gets same questions

### Scenario 2: Large Randomized Study
```json
{
  "n_per_category": 50,
  "randomize_assignment": true,
  "shuffle_categories": true
}
```
- 200 questions total (50 per category)
- Random assignment (different each time)
- Categories fully mixed

### Scenario 3: Balanced Deterministic (Current Default)
```json
{
  "n_per_category": 10,
  "randomize_assignment": false,
  "shuffle_categories": true
}
```
- 40 questions total (10 per category)
- Deterministic (same ID = same questions)
- Categories mixed but reproducible

## 🚀 Next Steps

To complete the migration from Flask:

1. **Database Integration**
   - Add response logging API
   - Store participant progress
   - Track reaction times

2. **Remaining Groups**
   - Implement groups 2, 3 (symbolic formal/natural language)
   - Implement groups 5, 6 (visual + concept with symbolic)

3. **Authentication**
   - Email/enrollment flow
   - Consent form
   - Session management

4. **Admin Features**
   - Participant dashboard
   - Response analytics
   - Data export

## 📝 Files Modified/Created

### Created:
- ✅ `public/config.json` - Configuration file
- ✅ `src/lib/config.ts` - Config loader utilities
- ✅ `src/lib/test-utils.ts` - Testing utilities
- ✅ `IMPLEMENTATION_GUIDE.md` - Documentation

### Modified:
- ✅ `src/lib/types.ts` - Added AppConfig, category field
- ✅ `src/lib/load-quiz.ts` - Complete rewrite for multi-category
- ✅ `src/app/[humanId]/page.tsx` - Group param support

## ✅ Checklist

- [x] Config system with all Flask app settings
- [x] Load all 4 categories (ff, bd, hd_novel, hd_comb)
- [x] Per-category sampling (n_per_category)
- [x] Deterministic assignment (same ID = same questions)
- [x] Random assignment option
- [x] Category shuffling
- [x] Groups 1 & 4 support (visual mode)
- [x] Total questions = 4 × n_per_category
- [x] Documentation and testing utilities

The implementation is **complete** for the requirements specified! 🎉
