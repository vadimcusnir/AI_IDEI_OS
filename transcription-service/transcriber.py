import logging
from typing import Optional, List, Dict
from faster_whisper import WhisperModel
from config import WHISPER_MODEL, DEVICE, COMPUTE_TYPE

logger = logging.getLogger(__name__)

# ── Lazy-loaded model cache ──
_models: Dict[str, WhisperModel] = {}


def _get_model(model_size: Optional[str] = None) -> WhisperModel:
    """Get or create a cached WhisperModel instance."""
    size = model_size or WHISPER_MODEL
    if size not in _models:
        logger.info(f"Loading Whisper model: {size} on {DEVICE} ({COMPUTE_TYPE})")
        _models[size] = WhisperModel(
            size,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
        )
        logger.info(f"Model {size} loaded successfully")
    return _models[size]


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    model_size: Optional[str] = None,
) -> dict:
    """
    Transcribe audio using faster-whisper.
    
    Returns:
        dict with transcript_text, language, segments
    """
    model = _get_model(model_size)

    logger.info(f"Transcribing: {audio_path} (lang={language or 'auto'}, model={model_size or WHISPER_MODEL})")

    transcribe_kwargs = {
        "beam_size": 5,
        "vad_filter": True,
        "vad_parameters": {
            "min_silence_duration_ms": 500,
        },
    }
    if language:
        transcribe_kwargs["language"] = language

    segments_gen, info = model.transcribe(audio_path, **transcribe_kwargs)

    transcript_parts: List[str] = []
    segment_list: List[dict] = []

    for segment in segments_gen:
        text = segment.text.strip()
        if text:
            transcript_parts.append(text)
            segment_list.append({
                "start": round(segment.start, 3),
                "end": round(segment.end, 3),
                "text": text,
            })

    transcript_text = " ".join(transcript_parts)

    logger.info(
        f"Transcription complete: {len(segment_list)} segments, "
        f"lang={info.language}, prob={info.language_probability:.2f}"
    )

    return {
        "transcript_text": transcript_text,
        "language": info.language,
        "segments": segment_list,
        "duration_seconds": info.duration,
        "word_count": len(transcript_text.split()),
    }
