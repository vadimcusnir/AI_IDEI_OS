FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# App code
COPY . .

# Create working dirs
RUN mkdir -p /app/downloads /app/normalized

# Pre-download default Whisper model
RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('medium', device='cpu')"

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
