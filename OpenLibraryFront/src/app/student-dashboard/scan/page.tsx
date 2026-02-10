"use client";

import React, { useState } from "react";
import QRScanner from "@/components/QRScanner";

export default function ScanPage() {
  const [qrId, setQrId] = useState<string | null>(null);

  // In a real flow, after detecting qrId, you might call your backend to
  // validate the book and create a Borrow record.
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Scan Book QR</h1>
  <QRScanner onDetected={(id: string) => setQrId(id)} />

      {qrId && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Next steps</h3>
          <p className="text-sm text-gray-700">
            Use this QR Code ID to loan the book. You can now call your backend
            borrow API with this ID.
          </p>
        </div>
      )}
    </div>
  );
}
