import subprocess
import os
import logging
from config import NORMALIZED_DIR

logger = logging.getLogger(__name__)


def normalize_audio(input_file: str) -> str:
    """
    Convert audio to mono 16kHz WAV for optimal speech recognition.
    
    ffmpeg -y -i input -ac 1 -ar 16000 output.wav
    """
    os.makedirs(NORMALIZED_DIR, exist_ok=True)

    basename = os.path.splitext(os.path.basename(input_file))[0]
    output_file = os.path.join(NORMALIZED_DIR, f"{basename}_normalized.wav")

    command = [
        "ffmpeg",
        "-y",             # overwrite
        "-i", input_file,
        "-ac", "1",       # mono
        "-ar", "16000",   # 16kHz
        "-acodec", "pcm_s16le",  # 16-bit PCM
        "-loglevel", "error",
        output_file,
    ]

    logger.info(f"Normalizing: {input_file} → {output_file}")

    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg normalization failed: {result.stderr}")

    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)
    logger.info(f"Normalized audio: {file_size_mb:.1f} MB")

    return output_file
