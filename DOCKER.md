# Docker Compose - OpenLibrary

Run all services (backend, auth, QR, frontend) with Docker Compose.

## Quick Start

```bash
docker compose up --build
```

Then open:
- **Frontend:** http://localhost:3000
- **Main API:** http://localhost:8000
- **Auth API:** http://localhost:8002
- **QR Service:** http://localhost:8001

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js app |
| backend | 8000 | Main backend (books, shelves, borrows) |
| auth | 8002 | Auth service (login, JWT) |
| qr | 8001 | QR generation & decode |

## Environment

Copy `.env.docker.example` to `.env` to override defaults:

```bash
cp .env.docker.example .env
```

## Seed Data

Auth and backend run seed automatically on startup:
- **Auth:** admin/admin123, librarian/librarian123, students/student123
- **Backend:** books, shelves, sample borrows, and **admin/admin123** for Django admin at `/admin/`

To re-seed manually:
```bash
docker compose exec auth python manage.py seed_initial
docker compose exec backend python manage.py seed_test_data
```

## Volumes

- `backend_db` – SQLite DB for main backend
- `backend_media` – Uploaded media files
- `auth_db` – SQLite DB for auth service
