# FlashCard Engine ⚡️
### Turn any PDF into a secure, AI-powered learning machine.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-blue?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 🎯 The Vision
Most students fall into the trap of "passive learning"—highlighting textbooks and re-reading notes with zero retention. **FlashCard Engine** transforms passive content into active recall. 

By combining **Gemini 1.5 Flash AI** with the scientific **SM-2 Spaced Repetition Algorithm**, this engine doesn't just help you memorize; it forces you to master concepts.

## ✨ Key Features

### 🧠 Smart AI Generation
Stop creating cards; start learning. Upload any PDF (textbooks, research papers, lecture notes) and our educator-tuned prompt generates **20 comprehensive flashcards** across a strict cognitive distribution:
- Core Definitions
- Deep "Why/How" Analysis
- Relationship Comparisons
- Real-world Applications
- Edge Cases & Synthesis

### 🔒 Secure Multi-Tenancy
Built for scale and privacy. 
- **Flexible Auth**: Login via **Google OAuth** or jump straight in with **Anonymous Guest Login**.
- **Privacy First**: Every deck is protected by PostgreSQL **Row-Level Security (RLS)**. Your study material is visible *only* to you.

### 📈 Mastery Tracking
- **Interactive Practice**: 3D-flipping cards with keyboard shortcuts (`Space` to flip, `1-2-3` to rate).
- **Spaced Repetition**: Automatic scheduling based on recall difficulty.
- **Dynamic Dashboard**: Personalized progress stats, daily review summaries, and motivational milestone banners.

## 🛠 Tech Stack
| Tier | Technology |
| --- | --- |
| **Frontend** | Next.js 14, Tailwind CSS, Lucide Icons |
| **Backend** | Next.js API Routes (Edge-ready) |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Auth** | Supabase Auth (SSO / Anonymous) |
| **AI** | Google Gemini 1.5 Flash |

## 🚀 Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/Jayanand07/Flashcard-Engine.git
cd flashcard-engine
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Database Migration
```sql
-- Core tables
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  card_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  last_studied TIMESTAMPTZ,
  regenerate_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'new',
  next_review DATE DEFAULT CURRENT_DATE,
  interval INTEGER DEFAULT 1,
  ease_factor FLOAT DEFAULT 2.5,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mcqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  deck_name TEXT NOT NULL,
  cards_reviewed INTEGER NOT NULL,
  easy_count INTEGER DEFAULT 0,
  okay_count INTEGER DEFAULT 0,
  hard_count INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  deck_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deck_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  generation_number INTEGER NOT NULL,
  cards JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  saved_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all for own data" ON decks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable all for own data" ON cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable all for own data" ON mcqs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable all for own data" ON sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable all for own data" ON quiz_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable all for own data" ON deck_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 4. Run Development
```bash
npm run dev
```

---

## 🎨 Professional Description
**FlashCard Engine** is a high-performance educational platform designed to bridge the gap between information and retention. By leveraging state-of-the-art Generative AI to parse complex documents and implementing the SM-2 algorithm for optimized recall intervals, it provides students with a scientific advantage in their learning journey.

## 🏷 #Hashtags
#EdTech #OpenSource #NextJS #AI #GeminiAI #SpacedRepetition #ActiveRecall #Supabase #TypeScript #ProductivityTool #LearningMachine
