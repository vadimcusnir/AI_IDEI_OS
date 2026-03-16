from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from enum import Enum


class WhisperModelSize(str, Enum):
    tiny = "tiny"
    base = "base"
    small = "small"
    medium = "medium"
    large = "large"


class TranscribeRequest(BaseModel):
    url: HttpUrl
    language: Optional[str] = None
    model: Optional[WhisperModelSize] = None
    prefer_subtitles: bool = True
    episode_id: Optional[str] = None


class TranscribeFileRequest(BaseModel):
    language: Optional[str] = None
    model: Optional[WhisperModelSize] = None


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str


class SourceMetadata(BaseModel):
    title: str = ""
    duration_seconds: Optional[float] = None
    uploader: str = ""
    thumbnail_url: Optional[str] = None
    platform: str = "unknown"
    subtitles_available: bool = False
    subtitle_languages: List[str] = []


class TranscriptResponse(BaseModel):
    transcript_text: str
    language: str
    segments: List[TranscriptSegment]
    duration_seconds: Optional[float] = None
    source: str = "whisper"  # "whisper" | "subtitles"
    metadata: Optional[SourceMetadata] = None
    word_count: int = 0


class JobStatus(BaseModel):
    job_id: str
    status: str  # "queued" | "downloading" | "normalizing" | "transcribing" | "completed" | "failed"
    progress_percent: int = 0
    result: Optional[TranscriptResponse] = None
    error: Optional[str] = None
