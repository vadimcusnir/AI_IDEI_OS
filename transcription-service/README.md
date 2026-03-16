# AI-IDEI Transcription Service

Self-hosted Python microservice for high-quality audio transcription.

## Pipeline

```
URL → yt-dlp metadata → subtitles check → audio download → ffmpeg normalize → faster-whisper → JSON
```

## Stack

| Tool | Purpose |
|------|---------|
| **yt-dlp** | Download audio + subtitles from YouTube, Vimeo, etc. |
| **ffmpeg** | Normalize audio to mono 16kHz WAV |
| **faster-whisper** | CTranslate2-optimized Whisper for speech recognition |
| **FastAPI** | HTTP API with sync + async job endpoints |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/transcribe` | Synchronous: URL → transcript |
| `POST` | `/transcribe/file` | Upload audio file → transcript |
| `POST` | `/transcribe/async` | Start async job, returns `job_id` |
| `GET`  | `/transcribe/status/{job_id}` | Poll job status |
| `POST` | `/metadata` | Fetch source metadata only |
| `GET`  | `/health` | Health check |

## Quick Start

```bash
# CPU mode
docker build -t transcription-service .
docker run -p 8000:8000 -e DEVICE=cpu transcription-service

# GPU mode (requires nvidia-docker)
docker run --gpus all -p 8000:8000 transcription-service
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL` | `medium` | Model size: tiny, base, small, medium, large |
| `DEVICE` | `cuda` | Compute device: cpu, cuda |
| `COMPUTE_TYPE` | `float16` | Precision: float16, int8, float32 |
| `TRANSCRIPTION_API_SECRET` | _(empty)_ | API auth secret (optional) |
| `MAX_DURATION_SECONDS` | `7200` | Max input duration (2h) |
| `SUBTITLE_LANGS` | `ro,en` | Subtitle language priority |

## Usage

```bash
# Transcribe YouTube video
curl -X POST http://localhost:8000/transcribe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=...", "prefer_subtitles": true}'

# Upload file
curl -X POST http://localhost:8000/transcribe/file \
  -F "file=@recording.mp3" \
  -F "language=ro"

# Async job
curl -X POST http://localhost:8000/transcribe/async \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=..."}'
# → {"job_id": "abc-123", "status": "queued"}

curl http://localhost:8000/transcribe/status/abc-123
# → {"job_id": "abc-123", "status": "completed", "progress_percent": 100, "result": {...}}
```

## Integration

Set `TRANSCRIPTION_SERVICE_URL` secret on the platform to route transcriptions through this service instead of ElevenLabs.
