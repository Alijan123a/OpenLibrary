"use client";

/**
 * All QR operations go through OpenLibraryQRService (port 8001).
 * - Generate QR image: use getQrImageUrl() for <img src> or generateQrPng() for Blob.
 * - Decode QR from image: use scanQrImage(file).
 */

export const QR_SERVICE_URL = process.env.NEXT_PUBLIC_QR_SERVICE_URL || "http://127.0.0.1:8001";

/** URL for QR code image (use in <img src={getQrImageUrl(qrCodeId)} />). */
export function getQrImageUrl(qrCodeId: string): string {
  if (!qrCodeId) return "";
  const encoded = encodeURIComponent(qrCodeId);
  return `${QR_SERVICE_URL}/generate?qr_code_id=${encoded}`;
}

/** Decode QR code from image file; returns the book id (qr_code_id) encoded in the QR. */
export async function scanQrImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${QR_SERVICE_URL}/scan-image`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to scan image (${res.status})`);
  }

  const data = await res.json();
  return data.qr_code_id as string;
}

/** Fetch QR code as PNG Blob (e.g. for download). For display, prefer getQrImageUrl(). */
export async function generateQrPng(qrCodeId: string): Promise<Blob> {
  const res = await fetch(`${QR_SERVICE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr_code_id: qrCodeId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to generate QR (${res.status})`);
  }
  return await res.blob();
}
