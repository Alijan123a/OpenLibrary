# OpenLibrary QR Service

Standalone FastAPI microservice for two core features:

1. **Generate QR code (image) from book id** — Input: book id (e.g. `qr_code_id` UUID). Output: PNG image of the QR code.
2. **Find book id from QR code** — Input: image containing a QR code. Output: decoded book id (string that was encoded in the QR).

Runs independently (e.g. port 8001). Optional: can call main backend for book lookup.

---

## Quick start (Windows PowerShell)

```powershell
cd d:\FinalProject\OpenLibraryQRService
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Optional, only for /scan book lookup:
# $env:BACKEND_API_URL = 'http://localhost:8000'
# $env:BACKEND_API_TOKEN = 'Bearer <your_jwt_here>'
python -m uvicorn main:app --reload --port 8001
```

---

## Endpoints

| Feature | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **1. Generate QR from book id** | GET | `/generate?qr_code_id=<id>` | Returns `image/png`. Use in `<img src="...">`. |
| **1. Generate QR from book id** | POST | `/generate` | Body: `{"qr_code_id": "<id>"}`. Returns `image/png`. |
| **2. Find book id from QR image** | POST | `/scan-image` | Form: upload `file` (image). Returns `{"qr_code_id": "<decoded>"}`. |
| (Optional) Book lookup | POST | `/scan` | Body: `{"qr_code_id": "<id>"}`. Calls main backend, returns book details. Requires `BACKEND_API_URL`. |

---

## Notes

- Book id is the value stored as `qr_code_id` on the main backend (e.g. UUID). Use it for both generate and decode.
- `/scan` is optional: set `BACKEND_API_URL` (and `BACKEND_API_TOKEN` if needed) only if you want to resolve `qr_code_id` to full book details.
