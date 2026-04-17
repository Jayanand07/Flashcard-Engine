# FlashCard Engine ⚡

An intelligent, automated flashcard system driven by AI.

## 🎯 What It Does
Most students waste countless hours manually creating study materials and reviewing them randomly with low retention. 

**FlashCard Engine** solves this problem by completely automating the friction points of studying. You simply upload a chapter, textbook excerpt, or study guide PDF, and the engine digests the content to automatically spit out 15 highly targeted conceptual flashcards.

Beyond generation, the app spaces out your studying scientifically. Using the proven SM-2 spaced repetition algorithm (the same science driving massive retention jumps up to 80% with tools like Anki), it naturally schedules cards based on your personal cognitive recall. 

## ✨ Features
- **PDF Upload & AI Card Generation**: Extract content from any document into study material instantly.
- **Flip Card Practice Mode**: Simple 3D interactive flashcards with integrated AI deeper-explanation functionality. 
- **SM-2 Spaced Repetition Scheduling**: Auto-calculates your next optimum review date dynamically depending on performance.
- **Progress Tracking & Deck Management**: Track 'Mastered', 'Learning', and 'New' cards effortlessly globally.

## 🧠 The Science: SM-2 Algorithm
The Spaced Repetition algorithm (SM-2) calculates exact intervals maximizing your brain's memory retention curve. Random shuffling doesn't work.

*If you rate a card 'Easy', its interval doubles.*  
*If you rate a card 'Hard', it immediately resets to a 1-day interval.*  

This process ensures you study exactly what you are about to forget right before you forget it, rather than wasting time reviewing mastered material.

## 🛠 Tech Stack
| Technology | Purpose | Why I Chose It |
| --- | --- | --- |
| **Next.js 14** | Fullstack Framework | App Router, Server Components + built-in API routing |
| **TypeScript** | Language | Type safety, intellisense, fewer runtime bugs |
| **Tailwind CSS** | Styling | Rapid utility-based styling for professional sleek UIs |
| **Supabase** | Backend & Database | Postgres under the hood, instant API, much better for relational data than Firebase |
| **Gemini 1.5 Flash**| AI Processing | Free tier, blazing fast processing, powerful context window |
| **pdf-parse** | Data parsing | Quick, dependency-light extraction of PDF contents |
| **Vercel** | Hosting/Deployment | Native Next.js support, edge-network ready, serverless function scaling |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Google AI Studio account for Gemini API key (free)

### Installation
1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   GEMINI_API_KEY=your_gemini_key
   ```
4. Set up Supabase tables via the SQL Editor:
   ```sql
   -- Create "decks" table
   CREATE TABLE decks (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       card_count INTEGER DEFAULT 0,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );

   -- Create "cards" table
   CREATE TABLE cards (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
       question TEXT NOT NULL,
       answer TEXT NOT NULL,
       difficulty TEXT DEFAULT 'new' CHECK (difficulty IN ('new', 'learning', 'mastered')),
       next_review DATE DEFAULT CURRENT_DATE,
       interval INTEGER DEFAULT 1,
       ease_factor FLOAT DEFAULT 2.5 CHECK (ease_factor >= 1.3 AND ease_factor <= 4.0),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

### Environment Variables
| Variable | Description | Source |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your database API URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Safe client-side API key | Supabase Dashboard |
| `GEMINI_API_KEY` | Server-safe secret Google key | Google AI Studio |

## 📁 Project Structure
- `/app/api`: Edge and Serverless functions containing DB routing and AI inference handlers
- `/app/deck`: Flashcard detail presentation interface
- `/app/practice`: The core SM-2 algorithm loop module and components
- `/components`: Scalable UI logic for bars, modals, and individual cards
- `/lib`: Helper library storing the supabase client, Gemini bindings, and SM-2 formulas.

## 🎨 Design Decisions
- **Why Gemini over GPT-4?** Gemini 1.5 Flash holds an extremely generous free tier alongside blazing-fast latency, excelling specifically in parsing large raw strings of uploaded documents effectively.
- **Why Supabase over Firebase?** Flashcards are inherently deeply relational (Decks mapped to Cards). PostgreSQL thrives in constrained relational logic, preventing document fragmentation.
- **Why SM-2 over simple random shuffle?** The science dictates memory must be stressed to be retained. Testing randomly is ineffective; SM-2 scientifically graphs decay and tests you uniquely on individual card retention.
- **Why Next.js App Router?** Eliminates the need to construct a separate Express backend by allowing `/api` serverless bindings safely adjacent to beautifully cached React Server Component trees.

## 📸 Screenshots
*Screenshots coming soon*

## 🌐 Live Demo
[Live Demo](your-vercel-url-here)

## 🔄 How It Works
1. User uploads a PDF
2. Text is extracted using pdf-parse
3. Gemini AI generates 15 high-quality flashcards
4. Cards are stored in Supabase
5. User practices cards in interactive flip mode
6. SM-2 algorithm schedules next review dates
7. App continuously adapts based on user performance
