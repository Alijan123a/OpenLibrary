import os
from typing import Any, Dict, List, Optional

import httpx
import io
import qrcode
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="OpenLibrary QR Service",
    description="1) Generate QR code image from book id (qr_code_id). 2) Decode QR code image to get book id (qr_code_id).",
)

# CORS: allow browser apps (e.g., Next.js) to call this service
allowed_origins = os.getenv("CORS_ALLOW_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins.split(",")] if allowed_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    qr_code_id: str


async def _fetch_books_from_backend(base_url: str, token: Optional[str] = None) -> List[Dict[str, Any]]:
    """(kept for backward compatibility) Fetch all books from backend `/api/books/`.
    The microservice no longer depends on this for basic QR functions, but the helper
    remains available.
    """
    url = base_url.rstrip("/") + "/api/books/"
    headers = {}
    if token:
        headers["Authorization"] = token

    books: List[Dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        while url:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                # Bubble up backend errors
                raise HTTPException(status_code=502, detail=f"Backend returned {resp.status_code}")

            data = resp.json()

            if isinstance(data, dict) and "results" in data:
                books.extend(data.get("results", []))
                url = data.get("next")
            elif isinstance(data, list):
                books.extend(data)
                url = None
            else:
                break

    return books


def _find_book_by_qr(books: List[Dict[str, Any]], qr_id: str) -> Optional[Dict[str, Any]]:
    for b in books:
        if str(b.get("qr_code_id")) == str(qr_id):
            return b
    return None


@app.post("/scan")
async def scan_qr(payload: ScanRequest):
    """
    Backwards-compatible endpoint kept: attempts to find a book via backend.
    Not required for pure QR generation/decoding features.
    """
    base_url = os.getenv("BACKEND_API_URL")
    if not base_url:
        raise HTTPException(status_code=500, detail="BACKEND_API_URL environment variable is not set")

    token = os.getenv("BACKEND_API_TOKEN")  # Optional: 'Bearer <token>'

    books = await _fetch_books_from_backend(base_url, token)
    book = _find_book_by_qr(books, payload.qr_code_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book with provided qr_code_id not found")

    return {"found": True, "book": book}


def _make_qr_png(data: str) -> bytes:
    """Generate QR code PNG bytes for the given string (e.g. book qr_code_id)."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


@app.post("/generate")
def generate_qr_post(payload: ScanRequest):
    """
    Feature 1: Generate QR code image from book id (qr_code_id).
    Request JSON: { "qr_code_id": "<uuid or string>" }
    Response: image/png
    """
    data = str(payload.qr_code_id)
    return Response(content=_make_qr_png(data), media_type="image/png")


@app.get("/generate")
def generate_qr_get(qr_code_id: str):
    """
    Feature 1 (GET): Generate QR code image from book id. Use in <img src=".../generate?qr_code_id=...">.
    """
    return Response(content=_make_qr_png(qr_code_id), media_type="image/png")


@app.post("/scan-image")
async def scan_image(file: UploadFile = File(...)):
    """
    Feature 2: Find book id from QR code. Upload an image containing a QR code;
    returns the decoded string (qr_code_id / book id) that was encoded in the QR.
    Request: multipart/form-data with `file` = image (PNG, JPEG, etc.)
    Response: { "qr_code_id": "<decoded string>" }
    """
    contents = await file.read()
    arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")

    detector = cv2.QRCodeDetector()
    data, points, _ = detector.detectAndDecode(img)
    if not data:
        raise HTTPException(status_code=404, detail="No QR code found in the image")

    return {"qr_code_id": data}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
