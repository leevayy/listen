FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	UV_PROJECT_ENVIRONMENT=/app/.venv \
	PATH=/app/.venv/bin:$PATH

# Install uv (static binary) from Astral's container image.
COPY --from=ghcr.io/astral-sh/uv:0.8.6 /uv /uvx /usr/local/bin/

# This Dockerfile is typically built from the repo root as context:
#   docker build -f tts/Dockerfile .
# So dependency files live under tts/ in the build context.
COPY tts/pyproject.toml tts/uv.lock ./

RUN uv sync --frozen --no-dev

# Copy only the TTS app sources into the image.
COPY tts/ ./

EXPOSE 8000

# Run without reload in containers.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
