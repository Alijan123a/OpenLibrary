"use client";

import { useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { scanQrImage } from "@/lib/qr";
import { borrowByQr } from "@/lib/borrow";
import { booksApi, type Book } from "@/lib/books";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getCoverImageUrl(coverImage?: string | null): string | null {
  if (!coverImage) return null;
  if (coverImage.startsWith("http")) return coverImage;
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
  return `${base}${path}`;
}

function toDateLabel(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fa-IR");
}

function toMoney(amount: number) {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ریال`;
}

function ScanContent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [book, setBook] = useState<Book | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setBook(null);
    setQrCodeId(null);
    setLoading(true);

    try {
      const decoded = await scanQrImage(file);
      if (!decoded) {
        setError("کد QR در تصویر خوانده نشد. لطفاً تصویر دیگری انتخاب کنید.");
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const bookData = await booksApi.getBookByQrCodeId(decoded);
      setBook(bookData);
      setQrCodeId(decoded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در پردازش QR");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleBorrow = async () => {
    if (!qrCodeId) return;
    setError("");
    setSuccess("");
    setBorrowing(true);
    try {
      const borrow = await borrowByQr(qrCodeId);
      setSuccess(`کتاب با موفقیت امانت گرفته شد. شماره امانت: ${borrow.id}`);
      setBook(null);
      setQrCodeId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ثبت امانت");
    } finally {
      setBorrowing(false);
    }
  };

  const handleReset = () => {
    setBook(null);
    setQrCodeId(null);
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <PageHeader
        title="اسکن QR کتاب"
        description="تصویر QR کتاب را آپلود کنید، مشخصات کتاب را مشاهده کرده و سپس قرض بگیرید"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">آپلود تصویر QR</h2>
          <p className="text-sm text-gray-500 mb-4">
            تصویر QR کتاب را از دستگاه خود انتخاب کنید تا مشخصات کتاب نمایش داده شود.
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
              در حال پردازش تصویر...
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

        {book && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">مشخصات کتاب</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {getCoverImageUrl(book.cover_image) && (
                <div className="flex-shrink-0">
                  <img
                    src={getCoverImageUrl(book.cover_image)!}
                    alt={`جلد ${book.title || "کتاب"}`}
                    className="w-40 h-56 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              )}
              <div className="flex-1 grid gap-3 md:grid-cols-2 text-sm text-gray-700">
                <div>شماره: <span className="font-medium">{book.id}</span></div>
                <div>عنوان: <span className="font-medium">{book.title || "—"}</span></div>
                <div>نویسنده: <span className="font-medium">{book.author || "—"}</span></div>
                <div>ISBN: <span className="font-medium">{book.isbn || "—"}</span></div>
                <div>ناشر: <span className="font-medium">{book.publisher || "—"}</span></div>
                <div>زبان: <span className="font-medium">{book.language || "—"}</span></div>
                <div>تاریخ انتشار: <span className="font-medium">{toDateLabel(book.published_date || null)}</span></div>
                <div>قیمت: <span className="font-medium">{toMoney(book.price || 0)}</span></div>
                <div className="md:col-span-2">توضیحات: <span className="font-medium">{book.description || "—"}</span></div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleBorrow}
                disabled={borrowing}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
              >
                {borrowing ? "در حال ثبت امانت..." : "قرض گرفتن"}
              </button>
              <button
                onClick={handleReset}
                disabled={borrowing}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                انتخاب کتاب دیگر
              </button>
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
