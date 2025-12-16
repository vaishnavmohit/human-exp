# Next.js Bongard Problem Quiz System

This Next.js application replaces the Flask-based quiz system with a modern, scalable implementation.

## 🎯 Overview

The app presents Bongard visual reasoning problems to participants across multiple categories (FF, BD, HD Novel, HD Comb) with configurable sampling and shuffling strategies.

## 📁 Project Structure

```
my-next-app/
├── public/
│   ├── config.json              # Main configuration file
│   ├── metadata/                # Problem metadata JSON files
│   │   ├── test_ff_balanced_500_with_desc.json
│   │   ├── test_bd_balanced_500_with_desc.json
│   │   ├── test_hd_novel_balanced_500_with_desc.json
│   │   └── test_hd_comb_balanced_500_with_desc.json
│   └── ShapeBongard/            # Image assets
├── src/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   └── [humanId]/page.tsx   # Quiz interface
│   ├── lib/
│   │   ├── config.ts            # Config loader and utilities
│   │   ├── load-quiz.ts         # Quiz loading logic
│   │   └── types.ts             # TypeScript types
│   └── components/
│       └── quiz/                # Quiz UI components
```

## ⚙️ Configuration (`public/config.json`)

```json
{
  "n_per_category": 10,
  "randomize_assignment": false,
  "shuffle_categories": true,
  "metadata_files": {
    "ff": "/metadata/test_ff_balanced_500_with_desc.json",
    "bd": "/metadata/test_bd_balanced_500_with_desc.json",
    "hd_novel": "/metadata/test_hd_novel_balanced_500_with_desc.json",
    "hd_comb": "/metadata/test_hd_comb_balanced_500_with_desc.json"
  },
  "category_order": ["ff", "bd", "hd_novel", "hd_comb"],
  "supported_groups": [1, 4],
  "image_base_path": "/ShapeBongard"
}
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `n_per_category` | number | Questions to sample from each category |
| `randomize_assignment` | boolean | `false` = deterministic, `true` = random |
| `shuffle_categories` | boolean | Shuffle questions across categories |
| `category_order` | array | Order in which categories are processed |
| `supported_groups` | array | Experimental groups (1 & 4 = visual) |

## 🚀 Usage

### URL Format

```
http://localhost:3000/[humanId]?group=[1|4]
```

**Examples:**
- `http://localhost:3000/participant_001?group=1` - Visual mode without concept
- `http://localhost:3000/participant_001?group=4` - Visual mode with concept

### Groups

| Group | Modality | Concept Shown |
|-------|----------|---------------|
| 1 | Visual (images) | No |
| 4 | Visual (images) | Yes |

## 🔄 Question Assignment Logic

### Deterministic (`randomize_assignment: false`)

1. Uses `humanId` to create deterministic random seed
2. Same `humanId` → same questions in same order
3. Samples `n_per_category` from each category
4. Optional shuffle across categories (deterministic)

### Random (`randomize_assignment: true`)

1. Uses `Math.random()` for shuffling
2. Same `humanId` may get different questions
3. Samples `n_per_category` from each category
4. Optional shuffle across categories (random)

## 📊 Total Questions

```
Total = n_per_category × 4 categories

Example: 10 × 4 = 40 questions
```

## 🔧 Development

### Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📝 Migration from Flask

### Implemented ✅

- ✅ Config-based question loading
- ✅ 4-category support (FF, BD, HD Novel, HD Comb)
- ✅ Deterministic & random assignment
- ✅ Per-category sampling
- ✅ Category shuffling
- ✅ Groups 1 & 4 (visual mode)
- ✅ Quiz UI with progress tracking

### Not Yet Implemented ❌

- ❌ Groups 2, 3, 5, 6 (symbolic/language modes)
- ❌ Response logging to database
- ❌ Participant registration
- ❌ Admin dashboard
- ❌ Data export

## 🧪 Testing Configurations

### Small Sample, Deterministic
```json
{
  "n_per_category": 5,
  "randomize_assignment": false,
  "shuffle_categories": false
}
```
Result: 20 questions, same order for same humanId

### Large Sample, Randomized
```json
{
  "n_per_category": 50,
  "randomize_assignment": true,
  "shuffle_categories": true
}
```
Result: 200 questions, random each time

## 🐛 Troubleshooting

**Images Not Loading**
- Check `public/ShapeBongard/` contains files
- Verify metadata paths match file structure

**Wrong Number of Questions**
- Check `n_per_category` in config
- Verify all 4 metadata files exist

**Same Questions When You Want Random**
- Set `randomize_assignment: true`
- Use different `humanId` values

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Flask App Reference](../../human-exp/code/README.md)
