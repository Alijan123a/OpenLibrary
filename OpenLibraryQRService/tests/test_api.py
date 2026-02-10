import io

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_generate_and_scan_image_roundtrip():
    qr_id = "test-qr-12345"

    # Generate QR image
    res = client.post("/generate", json={"qr_code_id": qr_id})
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"

    img_bytes = res.content

    # Upload the generated image back to /scan-image and check decoded value
    files = {"file": ("qr.png", io.BytesIO(img_bytes), "image/png")}
    res2 = client.post("/scan-image", files=files)
    assert res2.status_code == 200
    data = res2.json()
    assert data.get("qr_code_id") == qr_id
