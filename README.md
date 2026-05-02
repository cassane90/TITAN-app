# TITAN — Is This Broken?

**TITAN** (Tactical Intelligence for Technology Assessment and Networking) is an AI-powered hardware diagnostic web application. Users photograph a broken electronic device and receive an instant forensic analysis: device identification, risk assessment, repair cost estimates, local repair shops, DIY guides, and market resale values.

---

## Tech Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Frontend       | React 19 + TypeScript + Vite              |
| AI Engine      | Google Gemini API (`gemini-flash-latest`) |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage)    |
| PDF Export     | jsPDF + html2canvas                       |
| Styling        | Tailwind CSS                              |

---

## Features

- 📸 **Photo Capture** — Use your camera or upload images
- 🤖 **AI Forensic Diagnosis** — Identifies device brand/model and diagnoses issues
- 📍 **Location-Aware** — Finds local repair specialists near you
- 🔧 **DIY Guides** — YouTube search links for self-repair
- 💰 **Market Valuation** — Broken vs. fixed resale prices
- 🔐 **Authentication** — Google OAuth via Supabase
- 📄 **PDF Export** — Download full forensic report (Pro feature)
- 🌗 **Dark/Light Theme** — User-selectable theme
- 🧰 **Neural Lab** — Advanced diagnostic tools (Pro feature)

---

## Folder Structure

```
is-this-broken/
├── components/           # React UI components
│   ├── DiagnosticForm.tsx    # Main scan/intake form
│   ├── ResultCard.tsx        # Diagnosis result display
│   ├── Layout.tsx            # Navigation shell
│   ├── ProfileView.tsx       # User profile + settings
│   ├── NeuralLab.tsx         # Advanced lab (Pro)
│   ├── ChatAssistant.tsx     # AI chat helper
│   ├── Login.tsx             # Auth screen
│   └── ...
├── providers/
│   └── AppProvider.tsx       # Global state context
├── src/
│   ├── services/
│   │   ├── geminiService.ts      # Gemini AI integration
│   │   ├── supabaseService.ts    # Supabase auth + DB
│   │   ├── cacheService.ts       # localStorage result cache
│   │   └── titanService.ts       # TITAN-specific logic
│   └── utils/
│       └── errors.ts             # Custom error classes
├── supabase/
│   ├── migrations/           # Database migration files
│   └── functions/            # Edge functions
├── scripts/                  # Data ingestion scripts
├── datasets/                 # Local device spec datasets
├── docs/                     # Project documentation
│   ├── SRS.md                    # Software Requirements Spec
│   └── DESIGN.md                 # Architecture & HCI Design
├── types.ts                  # Shared TypeScript types
├── App.tsx                   # Root application component
└── constants.tsx             # App-wide constants
```

---

## Setup & Running Locally

### Prerequisites

- Node.js 18+
- A Google Gemini API key
- A Supabase project (free tier works)

### 1. Clone the repository

```bash
git clone <repo-url>
cd is-this-broken
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run tests

```bash
npm test
```

---

## Database Setup

Run the Supabase migration to create required tables:

```bash
supabase db push
```

The migration at `supabase/migrations/20240131_create_specs_table.sql` creates the `device_specs` table.

---

## Environment Variables Reference

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `VITE_GEMINI_API_KEY`    | Google Gemini API key (from Google AI Studio) |
| `VITE_SUPABASE_URL`      | Supabase project URL                          |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key             |

---

## Running Tests

This project uses [Vitest](https://vitest.dev/) for unit testing.

```bash
# Run all tests once
npm test

# Run in watch mode
npm run test:watch
```

---

## Design & Documentation

- 📋 [Software Requirements Specification (SRS)](./docs/SRS.md)
- 🏗️ [Architecture & HCI Design Document](./docs/DESIGN.md)

---

## License

Private academic project — Level 300 Software Engineering, 2026.
