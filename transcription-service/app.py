import uuid
import logging
import asyncio
import os
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    TranscribeRequest,
    TranscriptResponse,
    TranscriptSegment,
    SourceMetadata,
    JobStatus,
)
from downloader import extract_metadata, download_subtitles, download_audio, cleanup_files
from pipeline import normalize_audio
from transcriber import transcribe_audio
from config import API_SECRET, DOWNLOAD_DIR, MAX_DURATION_SECONDS

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ── In-memory job store (replace with Redis for production) ──
jobs: dict[str, JobStatus] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    logger.info("Transcription service started")
    yield
    logger.info("Transcription service stopped")


app = FastAPI(
    title="AI-IDEI Transcription Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_auth(authorization: Optional[str] = None):
    """Verify API secret if configured."""
    if API_SECRET:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        token = authorization.replace("Bearer ", "")
        if token != API_SECRET:
            raise HTTPException(status_code=403, detail="Invalid API secret")


# ═══════════════════════════════════════
# Synchronous transcription endpoint
# ═══════════════════════════════════════

@app.post("/transcribe", response_model=TranscriptResponse)
async def transcribe_url(req: TranscribeRequest, authorization: Optional[str] = Header(None)):
    verify_auth(authorization)

    url = str(req.url)
    files_to_cleanup = []

    try:
        # Step 1: Fetch metadata
        logger.info(f"[transcribe] Fetching metadata for: {url}")
        meta = extract_metadata(url)

        # Duration check
        if meta.get("duration_seconds") and meta["duration_seconds"] > MAX_DURATION_SECONDS:
            raise HTTPException(
                status_code=400,
                detail=f"Duration {meta['duration_seconds']}s exceeds max {MAX_DURATION_SECONDS}s",
            )

        source_metadata = SourceMetadata(
            title=meta.get("title", ""),
            duration_seconds=meta.get("duration_seconds"),
            uploader=meta.get("uploader", ""),
            thumbnail_url=meta.get("thumbnail_url"),
            platform=meta.get("platform", "unknown"),
            subtitles_available=meta.get("subtitles_available", False),
            subtitle_languages=meta.get("subtitle_languages", []),
        )

        # Step 2: Try subtitles first (if enabled and available)
        if req.prefer_subtitles and source_metadata.subtitles_available:
            logger.info("[transcribe] Attempting subtitle download...")
            subs = download_subtitles(url)
            if subs:
                segments = [
                    TranscriptSegment(start=s["start"], end=s["end"], text=s["text"])
                    for s in subs["segments"]
                ]
                return TranscriptResponse(
                    transcript_text=subs["text"],
                    language=subs["language"],
                    segments=segments,
                    duration_seconds=source_metadata.duration_seconds,
                    source="subtitles",
                    metadata=source_metadata,
                    word_count=len(subs["text"].split()),
                )

        # Step 3: Download audio
        logger.info("[transcribe] Downloading audio...")
        audio_file = await asyncio.to_thread(download_audio, url)
        files_to_cleanup.append(audio_file)

        # Step 4: Normalize audio
        logger.info("[transcribe] Normalizing audio...")
        normalized_file = await asyncio.to_thread(normalize_audio, audio_file)
        files_to_cleanup.append(normalized_file)

        # Step 5: Transcribe
        logger.info("[transcribe] Running speech recognition...")
        model_size = req.model.value if req.model else None
        result = await asyncio.to_thread(
            transcribe_audio,
            normalized_file,
            req.language,
            model_size,
        )

        segments = [
            TranscriptSegment(start=s["start"], end=s["end"], text=s["text"])
            for s in result["segments"]
        ]

        return TranscriptResponse(
            transcript_text=result["transcript_text"],
            language=result["language"],
            segments=segments,
            duration_seconds=result.get("duration_seconds"),
            source="whisper",
            metadata=source_metadata,
            word_count=result.get("word_count", 0),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[transcribe] Pipeline failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_files(*files_to_cleanup)


# ═══════════════════════════════════════
# File upload transcription endpoint
# ═══════════════════════════════════════

@app.post("/transcribe/file", response_model=TranscriptResponse)
async def transcribe_file(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
):
    verify_auth(authorization)

    files_to_cleanup = []

    try:
        # Save uploaded file
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        input_path = os.path.join(DOWNLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        files_to_cleanup.append(input_path)

        # Normalize
        normalized_file = await asyncio.to_thread(normalize_audio, input_path)
        files_to_cleanup.append(normalized_file)

        # Transcribe
        result = await asyncio.to_thread(transcribe_audio, normalized_file, language, model)

        segments = [
            TranscriptSegment(start=s["start"], end=s["end"], text=s["text"])
            for s in result["segments"]
        ]

        return TranscriptResponse(
            transcript_text=result["transcript_text"],
            language=result["language"],
            segments=segments,
            duration_seconds=result.get("duration_seconds"),
            source="whisper",
            word_count=result.get("word_count", 0),
        )

    except Exception as e:
        logger.error(f"[transcribe/file] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_files(*files_to_cleanup)


# ═══════════════════════════════════════
# Async job endpoints
# ═══════════════════════════════════════

@app.post("/transcribe/async")
async def transcribe_async(req: TranscribeRequest, authorization: Optional[str] = Header(None)):
    verify_auth(authorization)

    job_id = str(uuid.uuid4())
    jobs[job_id] = JobStatus(job_id=job_id, status="queued", progress_percent=0)

    asyncio.create_task(_run_pipeline_job(job_id, req))

    return {"job_id": job_id, "status": "queued"}


@app.get("/transcribe/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str, authorization: Optional[str] = Header(None)):
    verify_auth(authorization)

    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


async def _run_pipeline_job(job_id: str, req: TranscribeRequest):
    """Background pipeline execution with progress tracking."""
    url = str(req.url)
    files_to_cleanup = []

    try:
        # Metadata
        jobs[job_id].status = "downloading"
        jobs[job_id].progress_percent = 10
        meta = await asyncio.to_thread(extract_metadata, url)

        source_metadata = SourceMetadata(
            title=meta.get("title", ""),
            duration_seconds=meta.get("duration_seconds"),
            uploader=meta.get("uploader", ""),
            thumbnail_url=meta.get("thumbnail_url"),
            platform=meta.get("platform", "unknown"),
            subtitles_available=meta.get("subtitles_available", False),
            subtitle_languages=meta.get("subtitle_languages", []),
        )

        # Try subtitles
        if req.prefer_subtitles and source_metadata.subtitles_available:
            jobs[job_id].progress_percent = 30
            subs = await asyncio.to_thread(download_subtitles, url)
            if subs:
                segments = [
                    TranscriptSegment(start=s["start"], end=s["end"], text=s["text"])
                    for s in subs["segments"]
                ]
                jobs[job_id].status = "completed"
                jobs[job_id].progress_percent = 100
                jobs[job_id].result = TranscriptResponse(
                    transcript_text=subs["text"],
                    language=subs["language"],
                    segments=segments,
                    duration_seconds=source_metadata.duration_seconds,
                    source="subtitles",
                    metadata=source_metadata,
                    word_count=len(subs["text"].split()),
                )
                return

        # Download audio
        jobs[job_id].status = "downloading"
        jobs[job_id].progress_percent = 25
        audio_file = await asyncio.to_thread(download_audio, url)
        files_to_cleanup.append(audio_file)

        # Normalize
        jobs[job_id].status = "normalizing"
        jobs[job_id].progress_percent = 45
        normalized_file = await asyncio.to_thread(normalize_audio, audio_file)
        files_to_cleanup.append(normalized_file)

        # Transcribe
        jobs[job_id].status = "transcribing"
        jobs[job_id].progress_percent = 60
        model_size = req.model.value if req.model else None
        result = await asyncio.to_thread(transcribe_audio, normalized_file, req.language, model_size)

        segments = [
            TranscriptSegment(start=s["start"], end=s["end"], text=s["text"])
            for s in result["segments"]
        ]

        jobs[job_id].status = "completed"
        jobs[job_id].progress_percent = 100
        jobs[job_id].result = TranscriptResponse(
            transcript_text=result["transcript_text"],
            language=result["language"],
            segments=segments,
            duration_seconds=result.get("duration_seconds"),
            source="whisper",
            metadata=source_metadata,
            word_count=result.get("word_count", 0),
        )

    except Exception as e:
        logger.error(f"[async] Job {job_id} failed: {e}", exc_info=True)
        jobs[job_id].status = "failed"
        jobs[job_id].error = str(e)
    finally:
        cleanup_files(*files_to_cleanup)


# ═══════════════════════════════════════
# Metadata-only endpoint
# ═══════════════════════════════════════

@app.post("/metadata")
async def get_metadata(req: TranscribeRequest, authorization: Optional[str] = Header(None)):
    verify_auth(authorization)

    try:
        meta = await asyncio.to_thread(extract_metadata, str(req.url))
        return SourceMetadata(
            title=meta.get("title", ""),
            duration_seconds=meta.get("duration_seconds"),
            uploader=meta.get("uploader", ""),
            thumbnail_url=meta.get("thumbnail_url"),
            platform=meta.get("platform", "unknown"),
            subtitles_available=meta.get("subtitles_available", False),
            subtitle_languages=meta.get("subtitle_languages", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════
# Health check
# ═══════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "ok", "service": "transcription-service"}
