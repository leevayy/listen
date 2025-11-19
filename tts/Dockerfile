FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ffmpeg for pydub/speechkit + build tools for native wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY tts/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application
COPY tts/ /app/tts/

EXPOSE 8000

CMD ["uvicorn", "tts.main:app", "--host", "0.0.0.0", "--port", "8000"]
