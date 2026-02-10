"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import QRScanner from "@/components/QRScanner";

function ScanContent() {
  const [detected, setDetected] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="اسکن QR کتاب" description="QR کتاب را با دوربین اسکن کنید تا اطلاعات آن را مشاهده کنید" />

      <div className="max-w-lg mx-auto">
        <QRScanner
          title="اسکنر QR کتاب"
          onDetected={(id) => setDetected(id)}
        />

        {detected && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">نتیجه اسکن</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">شناسه کتاب:</span>
              <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">{detected}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <DashboardLayout allowedRoles={["student"]}>
      <ScanContent />
    </DashboardLayout>
  );
}
