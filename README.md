# SpeakIQ 🎤

AI-powered public speaking coach. Upload or record a video and get detailed feedback on your eye contact, speech pace, confidence, filler words, posture, and vocal variety — with actionable coaching drills.

---

## Quick Start

Get up and running in ~10 minutes.

### Prerequisites

- Node.js 18+
- Python 3.12 — **do not use 3.13 or 3.14**, prebuilt wheels aren't available yet.
  Download from [python.org/downloads](https://www.python.org/downloads/) and install.
- FFmpeg — run this then **restart your terminal** before continuing:
```bash
  winget install Gyan.FFmpeg
```
- API keys for [Twelve Labs](https://playground.twelvelabs.io/), [Deepgram](https://console.deepgram.com/), and [Google Gemini](https://aistudio.google.com/)

---

### 1. Backend
```bash
cd backend
py -3.12 -m venv .venv --without-pip
source .venv/Scripts/activate
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and fill in your keys:
```env
TWELVELABS_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_KEY=placeholder
SUPABASE_BUCKET=speakiq-videos

BACKEND_URL=http://localhost:8001
FRONTEND_URL=http://localhost:3000

MAX_VIDEO_SIZE_MB=500
MAX_VIDEO_DURATION_SECONDS=600
```

Start the backend:
```bash
uvicorn app.main:app --reload --port 8001
```

---

### 2. Frontend *(open a new terminal)*
```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

Start the frontend:
```bash
npm run dev
```

---

### 3. Open [http://localhost:3000](http://localhost:3000)

Upload a video and hit **Analyze**. Analysis takes 1–2 minutes depending on video length.

> Keep both terminals open while using the app. The backend must be running before the frontend will work.

---

### Troubleshooting

- **venv fails to create** — make sure you're using `py -3.12` not `python`, and that you're inside the `backend` folder
- **ffmpeg error on upload** — ffmpeg isn't on PATH, reinstall with `winget install Gyan.FFmpeg` and restart your terminal
- **Port errors** — make sure both `backend/.env` and `frontend/.env.local` use port 8001, and nothing else is running on that port
- **Supabase errors** — the placeholder values in `.env` are fine, Supabase is not used in this demo

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Python FastAPI |
| Video Analysis | Twelve Labs (Marengo + Pegasus models) |
| Transcription | Deepgram Nova-2 |
| Coaching AI | Google Gemini 2.5 Flash |
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
Gemini 2.5 Flash: combine signals
→ scored metrics + coaching tips
↓
Frontend: results dashboard
```

---

## API Reference

### `POST /api/analyze/submit`
Upload a video for analysis.

- **Body:** `multipart/form-data` with `video` field
- **Accepts:** MP4, MOV, WebM (max 500MB)
- **Returns:** `{ jobId: string }`

### `GET /api/analyze/status/:jobId`
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