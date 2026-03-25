# DementiaGlasses

An AI-assisted wearable glasses companion for people with dementia.  
The system **recognises faces** in real time, **recalls memories** about each person,  
and lets the wearer **ask questions** via voice — answered instantly by an AI.

---

## Architecture

```
dementia-glasses-1/
├── backend/          FastAPI + SQLAlchemy (Python 3.11)
│   └── app/
│       ├── api/routes/   face · memory · conversation · health
│       ├── services/     face_service · memory_service · speech_service · summarizer
│       ├── models/       Person · Memory · Conversation
│       └── db/           SQLite via SQLAlchemy
├── frontend/         React + Vite (JavaScript)
│   └── src/
│       ├── pages/    Dashboard · AddPerson · People · PersonDetail
│       ├── components/ Camera · Recorder · MemoryCard
│       └── services/ api.js (axios)
├── ai/
│   ├── face_recognition/  encoder.py · matcher.py
│   ├── speech/            whisper_model.py (local Whisper helper)
│   └── summarization/     llm.py (OpenAI client factory)
└── data/             faces/ · embeddings/ · db/  (persisted volumes)
```

---

## Quick Start (Docker Compose)

```bash
# 1. Copy the example env and add your OpenAI key
cp .env .env.local
# Edit OPENAI_API_KEY=sk-...

# 2. Start everything
docker compose up --build
```

| Service   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:5173     |
| Backend   | http://localhost:8000     |
| API Docs  | http://localhost:8000/docs |

---

## Local Development (no Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ffmpeg must be installed on the host: `sudo apt install ffmpeg`
export OPENAI_API_KEY=sk-...
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Features

| Feature | How it works |
|---|---|
| **Face Registration** | Capture photo → `face_recognition` encodes it → stored in `data/embeddings/` |
| **Face Recognition** | Every 3 s the camera frame is matched against known encodings |
| **Memory Bank** | Notes / events / audio / image links per person, stored in SQLite |
| **Voice Q&A** | Audio → OpenAI Whisper (transcription) → GPT-4o-mini (context-aware reply) |
| **AI Summary** | GPT-4o-mini summarises all memories for a person in 2–3 sentences |
| **People Manager** | Add / view / delete registered people and their memories |

---

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Required for Whisper transcription and GPT responses |
| `VITE_API_URL` | Backend URL used by the frontend (default: `http://localhost:8000`) |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/face/register` | Upload photo, register face encoding |
| `POST` | `/api/face/recognize` | Match frame against known faces |
| `GET` | `/api/memory/people` | List all registered people |
| `POST` | `/api/memory/people` | Create a person |
| `GET/PUT/DELETE` | `/api/memory/people/{id}` | Read / update / delete a person |
| `GET/POST` | `/api/memory/{person_id}` | List / add memories |
| `DELETE` | `/api/memory/{person_id}/memories/{mem_id}` | Delete a memory |
| `GET` | `/api/memory/{person_id}/summary` | AI summary of memories |
| `POST` | `/api/conversation/audio` | Transcribe audio + generate AI reply |
| `GET` | `/api/health` | Backend health check |