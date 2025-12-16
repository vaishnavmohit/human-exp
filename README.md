# Bongard Problem Human Experiment - Next.js App

A modern web application for conducting visual reasoning experiments using Bongard problems, built with Next.js, TypeScript, and Supabase.

## 🎯 Project Overview

This application presents participants with Bongard visual reasoning problems across four categories:
- **FF** (Free-Form)
- **BD** (Basic Diagrams)
- **HD Novel** (Human-Designed Novel)
- **HD Comb** (Human-Designed Combined)

Participants view positive and negative examples of a concept, then classify a query image.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Visit: `http://localhost:3000`

## 📖 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 3 steps
- **[Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)** - Detailed usage instructions
- **[Architecture](docs/ARCHITECTURE.md)** - System design and data flow diagrams
- **[Summary](docs/SUMMARY.md)** - Technical implementation details

## ⚙️ Configuration

Edit `public/config.json`:

```json
{
  "n_per_category": 10,           // Questions per category (total = 10 × 4 = 40)
  "randomize_assignment": false,   // Same participant → same questions
  "shuffle_categories": true       // Mix questions from all categories
}
```

## 🎮 Usage

### For Participants

**Invite Link:**
```
http://localhost:3000/invite/[participantId]
```

**Direct Quiz Access:**
```
http://localhost:3000/[participantId]?group=[1|4]
```

### Groups

| Group | Mode | Concept Shown |
|-------|------|---------------|
| 1 | Visual | No |
| 4 | Visual + Concept | Yes |

## 📁 Project Structure

```
my-next-app/
├── public/
│   ├── config.json              # Experiment configuration
│   ├── metadata/                # Problem definitions (4 categories)
│   └── ShapeBongard/            # Image assets
├── src/
│   ├── app/
│   │   ├── page.tsx             # Home/login page
│   │   ├── [humanId]/page.tsx   # Quiz interface
│   │   └── invite/[participantId]/page.tsx  # Invite handler
│   ├── lib/
│   │   ├── config.ts            # Config loader
│   │   ├── load-quiz.ts         # Quiz loading logic
│   │   ├── types.ts             # TypeScript types
│   │   └── supabase-server.ts   # Database client
│   └── components/
│       └── quiz/                # UI components
└── docs/                        # Documentation
```

## 🗄️ Database (Supabase)

### Tables

**participants**
- `id` (uuid, primary key)
- `participant_id` (text, unique)
- `email` (text)
- `group` (int)
- `created_at` (timestamp)

**responses**
- `id` (uuid, primary key)
- `participant_id` (text)
- `question_id` (text)
- `answer` (text: 'positive' or 'negative')
- `is_correct` (boolean)
- `reaction_time` (float)
- `created_at` (timestamp)

**sessions**
- `id` (uuid, primary key)
- `participant_id` (text)
- `current_index` (int)
- `assignment_json` (jsonb)
- `completed` (boolean)

## 🔄 Migration from Flask

This Next.js app replaces the Flask-based system with:

| Feature | Flask | Next.js |
|---------|-------|---------|
| Backend | Python/Flask | Next.js API Routes |
| Database | SQLite | Supabase (PostgreSQL) |
| Frontend | Jinja2 Templates | React/TypeScript |
| Deployment | Gunicorn | Vercel/Node.js |

### What's Implemented ✅
- Multi-category question loading (FF, BD, HD Novel, HD Comb)
- Config-based sampling and shuffling
- Deterministic participant assignment
- Groups 1 & 4 (visual mode)
- Quiz UI with progress tracking
- Invite link handling

### Coming Soon 🚧
- Response logging to Supabase
- Participant registration flow
- Groups 2, 3, 5, 6 (symbolic/language modes)
- Admin dashboard
- Data export

## 🧪 Testing

Open browser console:
```javascript
await quizTest.validateConfig()
await quizTest.analyzeDistribution('participant_001', 1)
```

## 🛠️ Development

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Type Checking
```bash
npm run build  # TypeScript compilation
```

## 📊 Example Workflows

### Testing with Small Sample
```json
{"n_per_category": 5, "randomize_assignment": false, "shuffle_categories": false}
```
→ 20 questions, deterministic, category-ordered

### Production Study
```json
{"n_per_category": 10, "randomize_assignment": false, "shuffle_categories": true}
```
→ 40 questions, deterministic, shuffled

## 🤝 Contributing

1. Follow existing code structure
2. Maintain compatibility with Flask app behavior
3. Keep deterministic assignment logic
4. Document configuration changes

## 📄 License

[Add your license]

---

**Built with:** Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase
