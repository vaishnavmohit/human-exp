# Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  URL: /participant_001?group=1                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js App ([humanId]/page.tsx)               │
│                                                              │
│  1. Extract humanId from URL: "participant_001"             │
│  2. Extract group from params: 1                            │
│  3. Call: loadQuiz(humanId, group)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               Quiz Loader (load-quiz.ts)                    │
│                                                              │
│  Step 1: Load config.json                                   │
│  Step 2: For each category in order:                        │
│          ├─ Load metadata JSON                              │
│          ├─ Shuffle (deterministic or random)               │
│          └─ Sample n_per_category questions                 │
│  Step 3: Optionally shuffle all questions                   │
│  Step 4: Return quiz array                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Quiz Questions                          │
│                   (40 questions total)                       │
│                                                              │
│  [FF_001, BD_045, HD_N_123, FF_002, HD_C_234, ...]          │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Data Flow

```
CONFIG LOADING:
┌──────────────┐
│ config.json  │ ─┐
└──────────────┘  │
                  ├─► loadConfig() ─► AppConfig object (cached)
┌──────────────┐  │
│ Environment  │ ─┘
└──────────────┘

METADATA LOADING (Per Category):
┌────────────────────────────┐
│ test_ff_balanced_500.json  │ ──┐
└────────────────────────────┘   │
┌────────────────────────────┐   │
│ test_bd_balanced_500.json  │ ──┤
└────────────────────────────┘   ├─► Load & Parse ─► BongardRawItem[]
┌────────────────────────────┐   │
│ test_hd_novel_...json      │ ──┤
└────────────────────────────┘   │
┌────────────────────────────┐   │
│ test_hd_comb_...json       │ ──┘
└────────────────────────────┘

QUESTION SAMPLING:
BongardRawItem[] (500 items)
        │
        ├─► createSeededRandom(humanId) ─► Deterministic RNG
        │
        ├─► shuffleArray(items, rng) ─► Shuffled items
        │
        └─► .slice(0, n_per_category) ─► 10 items
                │
                └─► bongardToQuizQuestion() ─► QuizQuestion[]

FINAL ASSEMBLY:
FF Questions (10)   ┐
BD Questions (10)   ├─► Concatenate ─► All Questions (40)
HD_N Questions (10) │                      │
HD_C Questions (10) ┘                      │
                                           ├─► Optional shuffle
                                           │
                                           └─► Final Quiz Array
```

## 🔄 Deterministic vs Random Flow

### Deterministic Assignment (randomize_assignment: false)

```
humanId: "alice@example.com"
        │
        ├─► Hash function ─► Numeric seed: 1234567890
        │
        ├─► Linear Congruential Generator (LCG)
        │   State = seed
        │   next() = (state * a + c) % m
        │
        └─► Used for:
            ├─ Per-category shuffling
            └─ Cross-category shuffling

Result: SAME humanId ─► SAME questions ─► SAME order
```

### Random Assignment (randomize_assignment: true)

```
Math.random()
        │
        └─► Used for:
            ├─ Per-category shuffling
            └─ Cross-category shuffling

Result: SAME humanId ─► DIFFERENT questions ─► DIFFERENT order
```

## 🎯 Question Selection Logic

```
                    ┌─────────────────────┐
                    │  Category: FF       │
                    │  Total: 500 items   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Shuffle with RNG    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Take first 10       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  FF Questions (10)  │
                    └─────────────────────┘

Repeat for: BD, HD_Novel, HD_Comb

Then:
    IF shuffle_categories:
        Shuffle all 40 questions (using same RNG)
    ELSE:
        Keep in category order
```

## 🖼️ Image Path Resolution

```
Metadata Path:
"ff/images/ff_nact4_5_0162/1/0.png"
        │
        ├─► Split by "/"
        │   ["ff", "images", "ff_nact4_5_0162", "1", "0.png"]
        │
        ├─► Extract: category="ff", uid="ff_nact4_5_0162"
        │
        └─► Build URL:
            image_base_path + "/" + path
            "/ShapeBongard/ff/images/ff_nact4_5_0162/1/0.png"

Final URL served to browser:
http://localhost:3000/ShapeBongard/ff/images/ff_nact4_5_0162/1/0.png
```

## 🎨 Group-Based Rendering

```
Group 1 (Visual only):
┌─────────────────────────────────┐
│  Positive Examples (6 images)   │
│  ┌───┬───┬───┐                  │
│  │ ✓ │ ✓ │ ✓ │                  │
│  └───┴───┴───┘                  │
│  ┌───┬───┬───┐                  │
│  │ ✓ │ ✓ │ ✓ │                  │
│  └───┴───┴───┘                  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Negative Examples (6 images)   │
│  ┌───┬───┬───┐                  │
│  │ ✗ │ ✗ │ ✗ │                  │
│  └───┴───┴───┘                  │
│  ┌───┬───┬───┐                  │
│  │ ✗ │ ✗ │ ✗ │                  │
│  └───┴───┴───┘                  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Query Image                     │
│  ┌───┐                           │
│  │ ? │  Which class?             │
│  └───┘                           │
└─────────────────────────────────┘

Group 4 (Visual + Concept):
[Same as Group 1]
        +
┌─────────────────────────────────┐
│  Concept Description:            │
│  "Objects with rotation"         │
└─────────────────────────────────┘
```

## 📊 State Management

```
Component State:
┌────────────────────────────────┐
│  QuizPage Component            │
│                                 │
│  State:                         │
│  ├─ quiz: QuizQuestion[]       │
│  ├─ index: number              │
│  ├─ showDialog: boolean        │
│  ├─ loading: boolean           │
│  └─ error: string | null       │
│                                 │
│  Effects:                       │
│  └─ useEffect(() => {          │
│       loadQuiz(humanId, group) │
│     }, [humanId, group])       │
└────────────────────────────────┘

User Interaction Flow:
View Question → Click Submit → Dialog Opens → Select Pos/Neg
        │                                           │
        └───────────────────────────────────────────┘
                            │
                            ▼
                    Increment index
                            │
                            ▼
                    Next question (or completion)
```

## 🔐 Configuration Priority

```
1. config.json (primary source)
        │
        └─► Defines:
            ├─ n_per_category
            ├─ randomize_assignment
            ├─ shuffle_categories
            ├─ metadata_files
            ├─ category_order
            └─ supported_groups

2. URL parameters (override behavior)
        │
        └─► Defines:
            ├─ humanId (from path)
            └─ group (from query)

3. Hardcoded defaults (fallback)
        │
        └─► Used if config.json fails to load
```

## 🧩 Module Dependencies

```
page.tsx
   │
   ├─► load-quiz.ts
   │      │
   │      ├─► config.ts (loadConfig, shuffleArray)
   │      └─► types.ts (BongardRawItem, QuizQuestion)
   │
   ├─► components/quiz/*
   │      ├─► QuizHeader
   │      ├─► ExampleCard
   │      ├─► QueryCard
   │      ├─► SubmitDialog
   │      └─► ProgressFooter
   │
   └─► types.ts (QuizQuestion)
```

---

This architecture provides:
- ✅ Deterministic participant assignment
- ✅ Flexible configuration
- ✅ Multi-category support
- ✅ Scalable group handling
- ✅ Clean separation of concerns
