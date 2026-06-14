# NyayaBot — Deployment Guide

## Option A: Docker Compose (Recommended for production)

```bash
# 1. Clone repo and add your .env
cp backend/.env.example backend/.env
# Fill in: ANTHROPIC_API_KEY, INDIANKANOON_API_KEY

# 2. Build and start all services
docker-compose up -d --build

# 3. Run data ingestion (first time only)
docker-compose exec backend python /data/ingest_constitution.py
docker-compose exec backend python /data/ingest_judgments.py

# 4. Access at http://localhost:3000
```

## Option B: Railway (1-click cloud deploy)

1. Fork the repo on GitHub
2. Create a new Railway project → Deploy from GitHub
3. Add PostgreSQL + Redis plugins from Railway marketplace
4. Set environment variables in Railway dashboard
5. Railway auto-detects Dockerfile and deploys

Cost: ~$10–20/month for a small deployment.

## Option C: Manual (VPS / DigitalOcean Droplet)

```bash
# Ubuntu 22.04 VPS — minimum 4GB RAM (for embedding model)

# Install dependencies
apt-get update && apt-get install -y postgresql redis-server python3.11 nodejs npm nginx

# PostgreSQL pgvector extension
apt-get install postgresql-16-pgvector

# Clone and set up
git clone https://github.com/yourname/nyayabot
cd nyayabot/backend && pip install -r requirements.txt
cd ../frontend && npm install && npm run build

# Configure nginx to serve frontend + proxy /api to FastAPI
# See nginx.conf in this directory

# Run backend with gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Run worker
celery -A utils.celery_app worker -D
```

## Scaling the legal database

| Stage | Judgments | Storage | RAM needed |
|---|---|---|---|
| MVP | 500 (landmark SC) | ~200 MB | 4 GB |
| Beta | 10,000 (SC + key HC) | ~2 GB | 8 GB |
| Production | 100,000+ | ~15 GB | 16 GB |
| Full corpus | 3M+ (all courts) | ~400 GB | 32 GB + GPU |

For the full corpus, use pgvector with IVFFlat index (lists=1000)
or migrate to Pinecone / Weaviate for hosted vector search.

## API Rate Limits to configure

- Chat endpoint: 20 requests/minute per user
- Document analysis: 5 uploads/hour per user
- Case search: 30 requests/minute per user

Use Redis + slowapi for rate limiting:
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address, storage_uri="redis://localhost:6379")
```
