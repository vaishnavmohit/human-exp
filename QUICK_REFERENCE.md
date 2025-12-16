# 🚀 Quick Reference Card

## URLs

| Purpose | URL |
|---------|-----|
| Home/Login | `http://localhost:3000` |
| Quiz (Group 1) | `http://localhost:3000/[participantId]?group=1` |
| Quiz (Group 4) | `http://localhost:3000/[participantId]?group=4` |
| Invite Link | `http://localhost:3000/invite/[participantId]` |

## File Locations

| What | Where |
|------|-------|
| Configuration | `public/config.json` |
| Metadata (FF) | `public/metadata/test_ff_balanced_500_with_desc.json` |
| Metadata (BD) | `public/metadata/test_bd_balanced_500_with_desc.json` |
| Metadata (HD Novel) | `public/metadata/test_hd_novel_balanced_500_with_desc.json` |
| Metadata (HD Comb) | `public/metadata/test_hd_comb_balanced_500_with_desc.json` |
| Images | `public/ShapeBongard/` |
| Logo | `public/img/Taltech-logo.png` |
| Home Page | `src/app/page.tsx` |
| Quiz Page | `src/app/[humanId]/page.tsx` |
| Invite Handler | `src/app/invite/[participantId]/page.tsx` |
| Quiz Loader | `src/lib/load-quiz.ts` |
| Config Loader | `src/lib/config.ts` |

## Configuration Quick Edit

```json
{
  "n_per_category": 10,           // Questions per category
  "randomize_assignment": false,   // true = random, false = deterministic
  "shuffle_categories": true       // true = mix, false = keep order
}
```

**Total Questions = n_per_category × 4**

## Common Tasks

### Change Number of Questions
```json
{"n_per_category": 15}  → 60 total questions (15 × 4)
{"n_per_category": 5}   → 20 total questions (5 × 4)
```

### Enable Random Assignment
```json
{"randomize_assignment": true}
```
→ Same participant gets different questions each time

### Disable Category Shuffling
```json
{"shuffle_categories": false}
```
→ Questions appear in order: FF → BD → HD Novel → HD Comb

## Groups

| Group | Mode | Concept Shown | Use Case |
|-------|------|---------------|----------|
| 1 | Visual | ❌ No | Test visual reasoning alone |
| 4 | Visual | ✅ Yes | Test with concept hints |

## Testing Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Example Participant IDs

```
participant_001
alice@example.com
bob@taltech.ee
student_12345
ENR67890
```

All work the same way!

## Quick Debug

### Images Not Loading?
1. Check `public/ShapeBongard/` exists
2. Verify file structure matches metadata paths
3. Check browser console for 404 errors

### Config Not Working?
1. Check JSON syntax (no trailing commas!)
2. Verify file is at `public/config.json`
3. Restart dev server

### Wrong Number of Questions?
1. Check `n_per_category` in config
2. Verify all 4 metadata files exist
3. Check browser console for errors

## Documentation Map

```
📁 docs/
├── QUICK_START.md         → Setup in 3 steps
├── IMPLEMENTATION_GUIDE.md → Detailed usage
├── ARCHITECTURE.md        → System design
├── SUMMARY.md             → Technical details
├── SUPABASE_SCHEMA.md    → Database schema
└── MIGRATION_GUIDE.md    → Flask comparison

📄 Root files:
├── README.md              → Overview
├── CHECKLIST.md           → Progress tracker
└── IMPLEMENTATION_COMPLETE.md → Summary report
```

## Key Numbers

- **Categories**: 4 (FF, BD, HD Novel, HD Comb)
- **Default Questions/Category**: 10
- **Default Total Questions**: 40
- **Supported Groups**: 1, 4
- **TypeScript Errors**: 0
- **Documentation Files**: 10+

## Next Steps Priority

1. **High**: Set up Supabase database
2. **High**: Implement response logging
3. **Medium**: Add groups 2, 3, 5, 6
4. **Medium**: Build admin dashboard
5. **Low**: Advanced analytics

## Support Files

- `CHECKLIST.md` - Full task list
- `IMPLEMENTATION_COMPLETE.md` - What's done
- `docs/SUPABASE_SCHEMA.md` - Database setup

---

**Everything you need to know on one page!** 📋
