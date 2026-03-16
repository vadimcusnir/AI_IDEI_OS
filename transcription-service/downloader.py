import yt_dlp
import os
import logging
from typing import Optional, Dict, Any, List
from config import DOWNLOAD_DIR, SUBTITLE_LANGS

logger = logging.getLogger(__name__)


def extract_metadata(url: str) -> Dict[str, Any]:
    """Extract metadata without downloading."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    subtitles = info.get("subtitles", {})
    auto_captions = info.get("automatic_captions", {})
    all_sub_langs = list(set(list(subtitles.keys()) + list(auto_captions.keys())))

    return {
        "title": info.get("title", ""),
        "duration_seconds": info.get("duration"),
        "uploader": info.get("uploader", info.get("channel", "")),
        "thumbnail_url": info.get("thumbnail"),
        "platform": info.get("extractor_key", "unknown").lower(),
        "subtitles_available": len(all_sub_langs) > 0,
        "subtitle_languages": all_sub_langs,
        "id": info.get("id", ""),
        "_subtitles": subtitles,
        "_auto_captions": auto_captions,
    }


def download_subtitles(url: str, preferred_langs: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
    """Try to download subtitles. Returns dict with text and language, or None."""
    langs = preferred_langs or SUBTITLE_LANGS
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    # Try manual subtitles first, then auto-generated
    for sub_type in ["subtitles", "automatic_captions"]:
        for lang in langs:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "writesubtitles": sub_type == "subtitles",
                "writeautomaticsub": sub_type == "automatic_captions",
                "subtitleslangs": [lang],
                "subtitlesformat": "vtt",
                "outtmpl": f"{DOWNLOAD_DIR}/%(id)s",
            }
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    video_id = info.get("id", "unknown")

                # Check for downloaded subtitle file
                for ext in ["vtt", "srt"]:
                    sub_path = f"{DOWNLOAD_DIR}/{video_id}.{lang}.{ext}"
                    if os.path.exists(sub_path):
                        with open(sub_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        # Parse VTT/SRT to plain text and segments
                        text, segments = _parse_subtitle_file(content, ext)
                        if text.strip():
                            # Cleanup file
                            os.remove(sub_path)
                            return {
                                "text": text,
                                "language": lang,
                                "segments": segments,
                                "source": "subtitles",
                                "kind": "manual" if sub_type == "subtitles" else "auto",
                            }
            except Exception as e:
                logger.warning(f"Subtitle download failed for {lang} ({sub_type}): {e}")
                continue

    return None


def download_audio(url: str) -> str:
    """Download best audio from URL using yt-dlp."""
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": f"{DOWNLOAD_DIR}/%(id)s.%(ext)s",
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "m4a",
            "preferredquality": "192",
        }],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info.get("id", "unknown")

    # Find the downloaded file
    for ext in ["m4a", "opus", "webm", "mp3", "ogg", "wav"]:
        path = f"{DOWNLOAD_DIR}/{video_id}.{ext}"
        if os.path.exists(path):
            return path

    # Fallback: use prepared filename
    filename = f"{DOWNLOAD_DIR}/{video_id}.m4a"
    if os.path.exists(filename):
        return filename

    raise FileNotFoundError(f"Downloaded audio not found for {video_id}")


def _parse_subtitle_file(content: str, fmt: str) -> tuple:
    """Parse VTT or SRT content into plain text and segments."""
    segments = []
    text_parts = []

    if fmt == "vtt":
        # Skip WEBVTT header
        blocks = content.split("\n\n")
        for block in blocks:
            lines = block.strip().split("\n")
            time_line = None
            text_lines = []
            for line in lines:
                if "-->" in line:
                    time_line = line
                elif time_line and line.strip() and not line.startswith("WEBVTT") and not line.startswith("Kind:") and not line.startswith("Language:"):
                    # Strip VTT tags like <c> </c>
                    clean = line.strip()
                    import re
                    clean = re.sub(r"<[^>]+>", "", clean)
                    if clean:
                        text_lines.append(clean)

            if time_line and text_lines:
                text = " ".join(text_lines)
                # Parse timestamps
                parts = time_line.split("-->")
                start = _parse_timestamp(parts[0].strip())
                end = _parse_timestamp(parts[1].strip().split(" ")[0])
                segments.append({"start": start, "end": end, "text": text})
                text_parts.append(text)

    elif fmt == "srt":
        blocks = content.strip().split("\n\n")
        for block in blocks:
            lines = block.strip().split("\n")
            if len(lines) >= 3:
                time_line = lines[1]
                text = " ".join(lines[2:]).strip()
                parts = time_line.split("-->")
                start = _parse_timestamp(parts[0].strip())
                end = _parse_timestamp(parts[1].strip())
                segments.append({"start": start, "end": end, "text": text})
                text_parts.append(text)

    # Deduplicate consecutive identical lines (common in auto-captions)
    deduped = []
    prev = ""
    for t in text_parts:
        if t != prev:
            deduped.append(t)
            prev = t

    return " ".join(deduped), segments


def _parse_timestamp(ts: str) -> float:
    """Parse VTT/SRT timestamp to seconds."""
    ts = ts.replace(",", ".")
    parts = ts.split(":")
    if len(parts) == 3:
        return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return float(parts[0]) * 60 + float(parts[1])
    return 0.0


def cleanup_files(*paths: str):
    """Remove temporary files."""
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.warning(f"Cleanup failed for {path}: {e}")
