# Deployment (API + TTS + PostgreSQL)

This repo includes Dockerfiles, docker-compose, and a GitHub Actions workflow to build images and auto-redeploy on push to `main`.

## Overview
- Backend API: Go server (port `8080`).
- TTS: FastAPI + Uvicorn (port `8000`), Python 3.12, includes `ffmpeg`.
- Database: PostgreSQL 16 with a persistent volume.
- Registry: Images pushed to GHCR.
- Deploy: GitHub Actions connects to your VPS via SSH, runs `docker compose pull && up -d`.

## 1) One-time VPS setup
1. Install Docker + Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```
2. Create app directory and add compose + env files:
   ```bash
   sudo mkdir -p /opt/listen
   sudo chown $USER:$USER /opt/listen
   cd /opt/listen
   ```
3. Copy `docker-compose.yml` from this repo to `/opt/listen` (first time only).
4. Create `/opt/listen/.env` from `.env.example` (see below):
   ```bash
   cp /path/to/repo/.env.example /opt/listen/.env
   # Edit values in /opt/listen/.env
   ```

Required `.env` values (at minimum):
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `GHCR_OWNER` (your GitHub username or org)
- `YC_API_KEY`, `YC_API_SECRET` (if used)
- `YC_S3_API_KEY`, `YC_S3_API_SECRET`

> Note: TTS image already contains ffmpeg. No extra system packages needed.

## 2) GitHub repository secrets
Add these in Settings → Secrets and variables → Actions:
- `GHCR_PAT`: Classic PAT with `write:packages` and `read:packages` scopes.
- `SSH_HOST`: VPS IP or hostname.
- `SSH_USER`: SSH user to connect.
- `SSH_KEY`: Private key contents for SSH (no passphrase recommended for automation).

## 3) What happens on push to main
The workflow `.github/workflows/build-and-deploy.yml` will:
1. Build and push the images:
   - `ghcr.io/<owner>/listen-tts:main` from `tts/Dockerfile`
   - `ghcr.io/<owner>/listen-api:main` from `backend/Dockerfile`
2. SSH to your VPS and run:
   ```bash
   docker login ghcr.io -u <owner> -p <GHCR_PAT>
   docker compose pull
   docker compose up -d
   docker image prune -f
   ```

## 4) Local testing (optional)
Build images locally:
```bash
# From repo root
docker build -f tts/Dockerfile -t listen-tts:dev .
docker build -f backend/Dockerfile -t listen-api:dev .
```
Run locally with compose (without GHCR):
```bash
# Edit docker-compose.yml to use local images or add `build:` sections temporarily
cp .env.example .env
docker compose up -d
```

## 5) Service endpoints
- API: `http://<VPS-IP>:8080`
- TTS: `http://<VPS-IP>:8000`

If you put a reverse proxy (Caddy/Traefik/Nginx) in front, terminate TLS there and route to these ports.

## 6) Notes
- The Go server binds to `127.0.0.1:8080` in code. Docker port mapping still works, but if you cannot reach it externally, consider updating it to bind `0.0.0.0`.
- TTS requires envs loaded inside the container (`python-dotenv` is used by your code; when running in Docker, set the envs via compose `.env`).
- Python 3.13: The TTS image uses Python 3.12 to avoid `audioop` removal issues. Your `requirements.txt` includes `audioop-lts` for future compatibility if you move to 3.13.

## 7) Troubleshooting
- Auth error pulling GHCR images: verify `GHCR_PAT` scope and that `GHCR_OWNER` in `/opt/listen/.env` matches your GitHub owner.
- Postgres not ready: compose healthcheck retries until DB responds; API waits on DB service health.
- Missing YC/S3 creds: ensure `/opt/listen/.env` has `YC_*` values set correctly.
