"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { scanQrImage } from "@/lib/qr";

type Props = {
  onDetected?: (qrCodeId: string) => void;
  title?: string;
  fps?: number; // how many frames per second to try scanning (default: 2)
};

export default function QRScanner({ onDetected, title = "اسکن QR کتاب", fps = 2 }: Props) {
  const [qrId, setQrId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied">("prompt");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setQrId(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPermission("granted");
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch (e: any) {
      setPermission("denied");
      setError(e?.message || "Camera access denied");
    }
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return; // not ready yet

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    // Convert canvas to Blob (JPEG keeps payload small)
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return;
    const file = new File([blob], "frame.jpg", { type: "image/jpeg" });

    try {
      const decoded = await scanQrImage(file);
      if (decoded) {
        setQrId(decoded);
        onDetected?.(decoded);
        stopStream(); // stop when found
      }
    } catch (err: any) {
      // Don't spam errors while scanning; only show meaningful errors
      // setError(err?.message || "Failed to decode QR");
    }
  }, [onDetected, stopStream]);

  useEffect(() => {
    if (!scanning) return;
    const intervalMs = Math.max(250, Math.floor(1000 / fps));
    timerRef.current = window.setInterval(captureAndScan, intervalMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [scanning, fps, captureAndScan]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const supportsMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="w-full max-w-md mx-auto p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-3">{title}</h2>

      {!supportsMedia && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-3">
          این مرورگر از دسترسی به دوربین پشتیبانی نمی‌کند. لطفاً مرورگر را به‌روز کنید یا از HTTPS استفاده کنید.
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {!scanning ? (
          <button
            onClick={startCamera}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
            disabled={!supportsMedia}
          >
            روشن کردن دوربین
          </button>
        ) : (
          <button
            onClick={stopStream}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            خاموش کردن دوربین
          </button>
        )}
      </div>

      <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg">
        <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {permission === "denied" && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-3">
          دسترسی به دوربین رد شد. لطفاً در تنظیمات مرورگر اجازه دسترسی را بدهید.
        </div>
      )}
      {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
      {qrId && (
        <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          کد QR شناسایی شد
        </div>
      )}
    </div>
  );
}
