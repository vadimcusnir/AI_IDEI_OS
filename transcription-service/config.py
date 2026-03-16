import os

# ── Directories ──
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "./downloads")
NORMALIZED_DIR = os.getenv("NORMALIZED_DIR", "./normalized")

# ── Whisper ──
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")
DEVICE = os.getenv("DEVICE", "cuda")  # "cpu" | "cuda"
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "float16")  # "float16" | "int8" | "float32"

# ── Limits ──
MAX_DURATION_SECONDS = int(os.getenv("MAX_DURATION_SECONDS", "7200"))  # 2 hours
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "500"))

# ── Auth ──
API_SECRET = os.getenv("TRANSCRIPTION_API_SECRET", "")

# ── Subtitle priority ──
SUBTITLE_LANGS = os.getenv("SUBTITLE_LANGS", "ro,en").split(",")
