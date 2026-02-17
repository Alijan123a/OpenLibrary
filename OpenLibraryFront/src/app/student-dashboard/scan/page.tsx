"use client";

import { useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { scanQrImage } from "@/lib/qr";
import { borrowByQr } from "@/lib/borrow";

function ScanContent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const qrCodeId = await scanQrImage(file);
      if (!qrCodeId) {
        setError("کد QR در تصویر خوانده نشد. لطفاً تصویر دیگری انتخاب کنید.");
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const borrow = await borrowByQr(qrCodeId);
      setSuccess(`کتاب با موفقیت امانت گرفته شد. شماره امانت: ${borrow.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در پردازش QR یا ثبت امانت");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader
        title="اسکن QR کتاب"
        description="تصویر QR کتاب را آپلود کنید تا کتاب را قرض بگیرید"
      />

      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">آپلود تصویر QR</h2>
          <p className="text-sm text-gray-500 mb-4">
            تصویر QR کتاب را از دستگاه خود انتخاب کنید. پس از خواندن کد، فرآیند امانت به‌صورت خودکار انجام می‌شود.
          </p>

          <label className="block">
            <span className="sr-only">انتخاب فایل</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
            />
          </label>

          {loading && (
            <div className="mt-4 text-sm text-gray-600">
              در حال پردازش تصویر و ثبت امانت...
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              {success}
            </div>
          )}
        </div>
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
