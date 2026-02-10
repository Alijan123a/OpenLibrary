OpenLibrary Auth Service

This Django + DRF microservice handles authentication and user roles, issuing JWTs
for other services (books/loans) to validate. It uses its own database (SQLite by default)
to follow the database-per-service pattern.

Quick start (Windows PowerShell)
```powershell
cd d:\FinalProject\OpenLibraryAuthService
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8002
```

Endpoints
- POST /api/login/            -> JWT access/refresh
- POST /api/token/refresh/    -> refresh access token
- GET  /api/user-role/        -> returns { role: ... } for current user

Configuration (env)
- DJANGO_SECRET_KEY: secret for Django
- SIMPLEJWT_SECRET: HMAC secret for signing JWTs; share the same value with other services
  that need to validate tokens (e.g., books service). If omitted, defaults to DJANGO_SECRET_KEY.

Notes
- Use HS256 with a strong shared secret in dev. For production, consider RS256 with
  public-key verification in downstream services.
