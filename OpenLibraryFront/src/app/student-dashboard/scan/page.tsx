"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import QRScanner from "@/components/QRScanner";
import { borrowByQr } from "@/lib/borrow";
import { booksApi, type Book } from "@/lib/books";

type ShelfOption = { shelf_book_id: number; shelf_id: number; location: string; copies_in_shelf: number };

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
  const [loading, setLoading] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [book, setBook] = useState<Book | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [shelves, setShelves] = useState<ShelfOption[]>([]);
  const [selectedShelfBookId, setSelectedShelfBookId] = useState<number | null>(null);

  const handleQrDetected = async (decoded: string) => {
    setError("");
    setSuccess("");
    setBook(null);
    setQrCodeId(null);
    setShelves([]);
    setSelectedShelfBookId(null);
    setLoading(true);

    try {
      const [bookData, shelvesData] = await Promise.all([
        booksApi.getBookByQrCodeId(decoded),
        booksApi.getShelvesForBook(decoded),
      ]);
      setBook(bookData);
      setQrCodeId(decoded);
      setShelves(shelvesData);
      if (shelvesData.length > 0) {
        setSelectedShelfBookId(shelvesData[0].shelf_book_id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات کتاب");
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!qrCodeId) return;
    setError("");
    setSuccess("");
    setBorrowing(true);
    try {
      const borrow = await borrowByQr(qrCodeId, selectedShelfBookId ?? undefined);
      setSuccess(`کتاب با موفقیت امانت گرفته شد. شماره امانت: ${borrow.id}`);
      setBook(null);
      setQrCodeId(null);
      setShelves([]);
      setSelectedShelfBookId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ثبت امانت");
    } finally {
      setBorrowing(false);
    }
  };

  const handleReset = () => {
    setBook(null);
    setQrCodeId(null);
    setShelves([]);
    setSelectedShelfBookId(null);
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <PageHeader
        title="اسکن QR کتاب"
        description="دوربین را روشن کنید و QR کتاب را جلوی دوربین بگیرید تا مشخصات کتاب نمایش داده شود"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <QRScanner
          title="اسکن با دوربین"
          onDetected={handleQrDetected}
          fps={2}
        />

        {loading && (
          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            در حال دریافت اطلاعات کتاب...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            {success}
          </div>
        )}

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
            {shelves.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  قفسه (انتخاب قفسه برای برداشتن کتاب)
                </label>
                <select
                  value={selectedShelfBookId ?? ""}
                  onChange={(e) => setSelectedShelfBookId(Number(e.target.value))}
                  className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  {shelves.map((s) => (
                    <option key={s.shelf_book_id} value={s.shelf_book_id}>
                      {s.location} ({s.copies_in_shelf} نسخه موجود)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleBorrow}
                disabled={borrowing || shelves.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
              >
                {borrowing ? "در حال ثبت امانت..." : shelves.length === 0 ? "نسخه‌ای موجود نیست" : "قرض گرفتن"}
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
