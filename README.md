# SpeakIQ 🎤

AI-powered public speaking coach. Upload or record a video and get detailed feedback on your eye contact, speech pace, confidence, filler words, posture, and vocal variety — with actionable coaching drills.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Python FastAPI |
| Video Analysis | Twelve Labs (Marengo + Pegasus models) |
| Transcription | Deepgram Nova-2 |
| Coaching AI | Google Gemini 1.5 Pro |
| Storage | Supabase Storage (optional, for future history) |

---

## Architecture

```
User uploads/records video
        ↓
FastAPI receives video → saves to temp file
        ↓
┌────────────────────────────────────┐
│  Parallel execution                │
│  ├── Twelve Labs: index + analyze  │
│  │   (eye contact, posture,        │
│  │    confidence, gestures)        │
│  └── Deepgram: transcribe          │
│      (filler words, WPM, text)     │
└────────────────────────────────────┘
        ↓
Gemini 1.5 Pro: combine signals
→ scored metrics + coaching tips
        ↓
Frontend: results dashboard
```

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- API keys for: [Twelve Labs](https://playground.twelvelabs.io/), [Deepgram](https://console.deepgram.com/), [Google Gemini](https://aistudio.google.com/)

### 1. Backend setup

Open a terminal, `cd` into the `backend` folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Mac/Linux
python -m venv .venv
source .venv/bin/activate

# Windows (Git Bash / PowerShell)
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy and fill in your API keys:

```bash
cp .env.example .env
```

Open `backend/.env` and set these three — the others can stay as defaults for now:

```env
TWELVELABS_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

You should see: `Uvicorn running on http://0.0.0.0:8000`

### 2. Frontend setup

Open a **second terminal**, `cd` into the `frontend` folder:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Important:** Run backend and frontend in two separate terminal windows. Don't run them in the same terminal session.

---

## API Reference

### `POST /analyze/submit`
Upload a video for analysis.

- **Body:** `multipart/form-data` with `video` field
- **Accepts:** MP4, MOV, WebM (max 500MB)
- **Returns:** `{ jobId: string }`

### `GET /analyze/status/:jobId`
Poll for analysis status and result.

**Response while processing:**
```json
{
  "jobId": "...",
  "status": "processing",
  "progress": 45
}
```

**Response when complete:**
```json
{
  "jobId": "...",
  "status": "complete",
  "progress": 100,
  "result": {
    "overall_score": 72,
    "summary": "...",
    "metrics": { ... },
    "filler_word_count": { "um": 12, "like": 8 },
    "words_per_minute": 148,
    "transcript_excerpt": "...",
    "coaching_tips": [ ... ],
    "timestamp": "...",
    "video_duration": 180
  }
}
```

---

## Metric Scoring

| Metric | Source | Description |
|---|---|---|
| Eye Contact | Twelve Labs | % of time looking at camera |
| Confidence | Twelve Labs | Body language + facial expression |
| Speech Pace | Deepgram | Words per minute (ideal: 130–160) |
| Filler Words | Deepgram | "um", "uh", "like", "you know", etc. |
| Posture | Twelve Labs | Upright vs. slouching/fidgeting |
| Vocal Variety | Gemini inference | Inferred from transcript patterns |

---

## Project Structure

```
speakiq/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          ← main page
│   │   ├── components/
│   │   │   ├── VideoUploader.tsx
│   │   │   ├── VideoRecorder.tsx
│   │   │   ├── ProcessingState.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── CoachingTips.tsx
│   │   │   └── ResultsDashboard.tsx
│   │   ├── hooks/
│   │   │   └── useRecorder.ts    ← MediaRecorder hook
│   │   ├── lib/
│   │   │   ├── api.ts            ← backend client + polling
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   └── ...config files
│
└── backend/
    └── app/
        ├── main.py               ← FastAPI app
        ├── config.py             ← settings from .env
        ├── routers/
        │   └── analyze.py        ← upload + status endpoints
        ├── services/
        │   ├── twelvelabs_service.py
        │   ├── deepgram_service.py
        │   ├── gemini_service.py
        │   └── pipeline.py       ← orchestration
        └── models/
            ├── schemas.py        ← Pydantic types
            └── job_store.py      ← in-memory job state
```

---

## Future Improvements

- **Auth + history** — Add Supabase auth and store past analyses per user
- **Progress tracking** — Show improvement over time with charts
- **Specific timestamps** — Jump to moments in video where issues occurred
- **Share results** — Generate a shareable report link
- **Custom rubrics** — Let users specify what they're practicing (pitch, interview, lecture)
- **Redis job queue** — Replace in-memory store for multi-worker deployments
