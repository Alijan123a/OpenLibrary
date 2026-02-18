# Liara Deployment Guide

Deploy OpenLibrary to [Liara](https://liara.ir) as four separate apps. All apps should use the **same private network** so they can communicate internally.

## Prerequisites

- [Liara CLI](https://docs.liara.ir/references/cli/about/) installed: `npm install -g @liara/cli`
- Liara account: `liara login`

## 1. Create Apps and Private Network

1. Go to [Liara Console](https://console.liara.ir/apps/create)
2. Create a **private network** (e.g. `openlibrary`)
3. Create 4 apps with platform **Docker**, all in the same network:
   - `openlibrary-auth` (Auth)
   - `openlibrary-book` (Backend)
   - `openlibrary-frontend` (Frontend)
   - `openlibrary-qr` (QR Service)

## 2. liara.json Files

Each service has a `liara.json` committed to the repo (used by both CLI and CI/CD):

| Service | File | App ID | Port |
|---------|------|--------|------|
| Book    | `OpenLibrary/liara.json` | `openlibrary-book` | 8000 |
| Auth    | `OpenLibraryAuthService/liara.json` | `openlibrary-auth` | 8002 |
| Frontend | `OpenLibraryFront/liara.json` | `openlibrary-frontend` | 3000 |
| QR      | `OpenLibraryQRService/liara.json` | `openlibrary-qr` | 8001 |

## 3. Set Environment Variables

In Liara Console -> each app -> Environment Variables:

### Auth (`openlibrary-auth`)
| Variable | Value |
|----------|-------|
| `DJANGO_SECRET_KEY` | (generate a strong secret) |
| `SIMPLEJWT_SECRET` | (generate a strong secret) |
| `AUTH_SERVICE_INTERNAL_KEY` | (shared secret, same as backend) |
| `DATABASE_PATH` | `/app/data/db.sqlite3` |

### Backend (`openlibrary-book`)
| Variable | Value |
|----------|-------|
| `DJANGO_SECRET_KEY` | (generate a strong secret) |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1,.liara.run` |
| `DATABASE_PATH` | `/app/data/db.sqlite3` |
| `MEDIA_ROOT` | `/app/media` |
| `AUTH_SERVICE_VERIFY_URL` | `https://openlibrary-auth.liara.run/api/user-role/` |
| `AUTH_SERVICE_INTERNAL_URL` | `https://openlibrary-auth.liara.run/api/internal/users-info/` |
| `AUTH_SERVICE_INTERNAL_KEY` | (same as auth) |
| `CORS_ALLOWED_ORIGINS` | `https://openlibrary-frontend.liara.run,http://localhost:3000` |

### Frontend (`openlibrary-frontend`)

Frontend uses **build args** (not runtime env) because Next.js bakes `NEXT_PUBLIC_*` at build time. These are passed automatically by the CI/CD workflow from GitHub Secrets (see section 6).

### QR (`openlibrary-qr`)
| Variable | Value |
|----------|-------|
| `BACKEND_API_URL` | `https://openlibrary-book.liara.run` |
| `CORS_ORIGINS` | `*` or `https://openlibrary-frontend.liara.run` |

## 4. Disks (Persistent Storage)

Auth and Backend use SQLite and need persistent disks:

1. In Liara Console -> Auth app -> Disks -> Create disk (e.g. `auth-data`, 1GB)
2. Mount path: `/app/data`
3. Repeat for Backend: disk `book-data`, mount `/app/data`
4. Optional for media: disk `book-media`, mount `/app/media`

## 5. First Manual Deploy

For the very first deployment (before CI/CD is set up), deploy in order:

```bash
# 1. Auth
cd OpenLibraryAuthService && liara deploy

# 2. Backend
cd ../OpenLibrary && liara deploy

# 3. QR
cd ../OpenLibraryQRService && liara deploy

# 4. Frontend (with build args)
cd ../OpenLibraryFront && liara deploy \
  --build-arg NEXT_PUBLIC_API_URL=https://openlibrary-book.liara.run \
  --build-arg NEXT_PUBLIC_AUTH_URL=https://openlibrary-auth.liara.run \
  --build-arg NEXT_PUBLIC_LOGIN_API=https://openlibrary-auth.liara.run/api/login/ \
  --build-arg NEXT_PUBLIC_CHECK_ROLE=https://openlibrary-auth.liara.run/api/user-role/ \
  --build-arg NEXT_PUBLIC_QR_SERVICE_URL=https://openlibrary-qr.liara.run
```

## 6. CI/CD (Automated Deployment via GitHub Actions)

After the first deploy, every `git push` to `main` automatically deploys **only the changed services**.

### How it works

4 GitHub Actions workflows in `.github/workflows/`:

| Workflow | Triggers on | Deploys |
|----------|-------------|---------|
| `deploy-auth.yml` | `OpenLibraryAuthService/**` | Auth service |
| `deploy-book.yml` | `OpenLibrary/**` | Book service |
| `deploy-qr.yml` | `OpenLibraryQRService/**` | QR service |
| `deploy-frontend.yml` | `OpenLibraryFront/**` | Frontend |

### Setup GitHub Secrets

Go to [GitHub repo settings -> Secrets and variables -> Actions](https://github.com/Alijan123a/OpenLibrary/settings/secrets/actions) and add:

| Secret | Value |
|--------|-------|
| `LIARA_API_TOKEN` | Your Liara API token (Console -> Account -> API Token) |
| `NEXT_PUBLIC_API_URL` | `https://openlibrary-book.liara.run` |
| `NEXT_PUBLIC_AUTH_URL` | `https://openlibrary-auth.liara.run` |
| `NEXT_PUBLIC_LOGIN_API` | `https://openlibrary-auth.liara.run/api/login/` |
| `NEXT_PUBLIC_CHECK_ROLE` | `https://openlibrary-auth.liara.run/api/user-role/` |
| `NEXT_PUBLIC_QR_SERVICE_URL` | `https://openlibrary-qr.liara.run` |

### Deploy flow

- Edit `OpenLibrary/books/views.py` -> push -> only book service deploys
- Edit `OpenLibraryFront/src/...` -> push -> only frontend deploys
- Edit files across services -> all affected services deploy in parallel

## 7. URLs After Deployment

- Frontend: `https://openlibrary-frontend.liara.run`
- Auth: `https://openlibrary-auth.liara.run`
- Backend: `https://openlibrary-book.liara.run`
- QR: `https://openlibrary-qr.liara.run`

## Seed Users

**Auth service** (frontend login): `admin/admin123`, `librarian/librarian123`, `students/student123`
Seeded automatically on startup via Dockerfile.

**Book service** (Django admin at `/admin/`): `admin/admin123`
Seeded by `seed_test_data` on backend startup. If you can't login, run:

```bash
liara app shell -a openlibrary-book -c "python manage.py seed_test_data"
```

Or create manually: `python manage.py createsuperuser`
