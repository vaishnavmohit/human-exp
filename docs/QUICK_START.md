# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Configure Your Experiment

Edit `public/config.json`:

```json
{
  "n_per_category": 10,           // How many questions per category?
  "randomize_assignment": false,   // Same participant = same questions?
  "shuffle_categories": true       // Mix questions from all categories?
}
```

### 2. Start the Server

```bash
cd human-exp-nextjs/my-next-app
npm install
npm run dev
```

### 3. Open Quiz

```
http://localhost:3000/[participant_id]?group=[1 or 4]
```

**Examples:**
- `http://localhost:3000/participant_001?group=1`
- `http://localhost:3000/alice@example.com?group=4`

---

## 🎮 Groups Explained

| Group | What They See |
|-------|---------------|
| **1** | 6 positive images + 6 negative images + query image |
| **4** | Same as Group 1 + concept description text |

---

## 🔧 Common Configurations

### For Testing (Quick & Deterministic)
```json
{
  "n_per_category": 5,
  "randomize_assignment": false,
  "shuffle_categories": false
}
```
→ 20 questions, same every time, in category order

### For Production (Balanced & Deterministic)
```json
{
  "n_per_category": 10,
  "randomize_assignment": false,
  "shuffle_categories": true
}
```
→ 40 questions, same participant gets same questions, mixed categories

### For Practice (Random)
```json
{
  "n_per_category": 10,
  "randomize_assignment": true,
  "shuffle_categories": true
}
```
→ 40 questions, different every time

---

## 📊 How Many Questions?

```
Total Questions = n_per_category × 4 categories

Examples:
  n_per_category = 5  → 20 questions
  n_per_category = 10 → 40 questions
  n_per_category = 25 → 100 questions
```

---

## 🧪 Test Your Setup

Open browser console and run:

```javascript
await quizTest.validateConfig()
```

Should show:
```
✅ Configuration Validation
  ✅ All required fields present
  ✅ ff: 500 items
  ✅ bd: 500 items
  ✅ hd_novel: 500 items
  ✅ hd_comb: 500 items
```

---

## 🐛 Troubleshooting

### "Failed to load quiz metadata"
- Check that all 4 JSON files exist in `public/metadata/`
- Verify file names match `config.json`

### Images not showing
- Ensure `public/ShapeBongard/` directory exists
- Check that images are in correct subdirectories (ff/, bd/, hd/)

### Same questions every time (when you want random)
- Set `"randomize_assignment": true` in config
- Clear browser cache
- Use different participant IDs

### Different questions every time (when you want same)
- Set `"randomize_assignment": false` in config
- Use **exact same** participant ID (case-sensitive)

---

## 📚 Next Steps

1. **Current**: Testing with visual mode (groups 1 & 4)
2. **Next**: Add response logging to database
3. **Later**: Implement symbolic/language modes (groups 2, 3, 5, 6)

---

## 💡 Pro Tips

- **Participant IDs**: Use emails for real studies, simple IDs for testing
- **Deterministic Mode**: Perfect for experimental control (same ID = same test)
- **Random Mode**: Good for practice sessions or exploratory testing
- **Category Shuffling**: Prevents category-based learning effects
- **n_per_category**: Start small (5-10) for testing, increase for real study

---

## 🎯 URLs You'll Use

| Purpose | URL |
|---------|-----|
| Home page | `http://localhost:3000` |
| Group 1 quiz | `http://localhost:3000/[id]?group=1` |
| Group 4 quiz | `http://localhost:3000/[id]?group=4` |

---

## 📞 Help

- See `IMPLEMENTATION_GUIDE.md` for detailed documentation
- See `SUMMARY.md` for technical implementation details
- Check `src/lib/test-utils.ts` for debugging tools
