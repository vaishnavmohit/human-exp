# Group 1 vs Group 4 - UI Differences

## Overview

The experiment uses **group-based UI variations** to test different conditions:
- **Group 1**: Pure visual (no concept shown)
- **Group 4**: Visual + concept description

---

## Visual Comparison

### Group 1 - Visual Only Mode
**URL**: `http://localhost:3000/participant_id?group=1`

```
┌────────────────────────────────────────────────────────┐
│ Human Experiment              [participant_id]        │
└────────────────────────────────────────────────────────┘
│                                                        │
│  [Positive Examples]        [Negative Examples]       │
│  ┌─────┐ ┌─────┐            ┌─────┐ ┌─────┐         │
│  │     │ │     │            │     │ │     │         │
│  └─────┘ └─────┘            └─────┘ └─────┘         │
│                                                        │
│  Query Image:                                         │
│  ┌─────────┐                                         │
│  │         │       [Submit Response]                 │
│  └─────────┘                                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Features**:
- ❌ Concept label **NOT shown**
- ✅ Visual examples only
- ✅ Participant must infer pattern from images alone

---

### Group 4 - Visual + Concept Mode
**URL**: `http://localhost:3000/participant_id?group=4`

```
┌────────────────────────────────────────────────────────┐
│ Human Experiment                                      │
│              Concept: has eight straight lines        │
│                                      [participant_id] │
└────────────────────────────────────────────────────────┘
│                                                        │
│  [Positive Examples]        [Negative Examples]       │
│  ┌─────┐ ┌─────┐            ┌─────┐ ┌─────┐         │
│  │     │ │     │            │     │ │     │         │
│  └─────┘ └─────┘            └─────┘ └─────┘         │
│                                                        │
│  Query Image:                                         │
│  ┌─────────┐                                         │
│  │         │       [Submit Response]                 │
│  └─────────┘                                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Concept label **shown** in header
- ✅ Visual examples + textual description
- ✅ Participant has both visual and semantic cues

---

## Implementation Details

### QuizHeader Component
```tsx
export function QuizHeader({
  concept,
  pid,
  group,
}: {
  concept: string;
  pid: string;
  group: number;
}) {
  // Group 1: No concept shown (pure visual)
  // Group 4: Concept shown (visual + concept)
  const showConcept = group === 4;

  return (
    <header className="...">
      <div>Human Experiment</div>

      {showConcept && (
        <div>
          Concept: <span>{concept}</span>
        </div>
      )}

      <div>{pid}</div>
    </header>
  );
}
```

### Quiz Page Usage
```tsx
<QuizHeader 
  concept={question.concept} 
  pid={humanId as string} 
  group={group}  // <-- Group from URL param
/>
```

---

## Testing

### Test Group 1
```bash
# Open in browser:
http://localhost:3000/test_user?group=1

# Expected:
- Header shows: "Human Experiment" and "test_user"
- NO concept label in middle
```

### Test Group 4
```bash
# Open in browser:
http://localhost:3000/test_user?group=4

# Expected:
- Header shows: "Human Experiment" and "test_user"
- Concept label shown in middle: "Concept: has eight straight lines"
```

---

## Supported Groups

According to `public/config.json`:
```json
{
  "supported_groups": [1, 4]
}
```

**Active Groups**:
- ✅ Group 1 - Visual only
- ✅ Group 4 - Visual + concept

**Other Groups** (placeholders for future):
- Groups 2, 3, 5, 6 - Not yet implemented

---

## Example Concepts

From metadata files, concepts include:
- "has eight straight lines, exist regular"
- "has three curves, exist zigzag"
- "no horizontal lines, all arcs normal"
- etc.

**Group 1**: Sees shapes, must figure out the pattern
**Group 4**: Sees shapes + reads "has eight straight lines"

---

## Data Collection

Both groups save identical response data:
```typescript
{
  participant_id: "user_id",
  question_id: "hd_001_pos",
  category: "hd_novel",
  answer: "positive",
  is_correct: true,
  reaction_time: 2.5,
  assigned_group: 1 // or 4
}
```

**Analysis**: Compare reaction times and accuracy between groups to see if concept label helps or hinders performance.

---

## Summary

| Feature | Group 1 | Group 4 |
|---------|---------|---------|
| Concept label | ❌ Hidden | ✅ Shown |
| Visual examples | ✅ Yes | ✅ Yes |
| Use case | Pure visual reasoning | Visual + semantic cues |
| Hypothesis | Tests abstract pattern recognition | Tests concept-guided recognition |

Both groups see the same images and questions, only the **concept visibility** differs.
