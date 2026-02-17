"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { booksApi, type Book, type CreateBookData } from "@/lib/books";
import { getShelves, getShelfBooks, type Shelf, type ShelfBook } from "@/lib/shelves";
import { getBorrows, type Borrow } from "@/lib/borrow";
import { getQrImageUrl } from "@/lib/qr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getCoverImageUrl(coverImage?: string | null): string | null {
  if (!coverImage) return null;
  if (coverImage.startsWith("http")) return coverImage;
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = coverImage.startsWith("/") ? coverImage : `/${coverImage}`;
  return `${base}${path}`;
}

const BORROW_DAYS = 14;
const PENALTY_PER_DAY = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateLabel(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fa-IR");
}

function toMoney(amount: number) {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ریال`;
}

function BookModal({
  open,
  book,
  onClose,
  onSaved,
}: {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("Persian");
  const [description, setDescription] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [totalCopies, setTotalCopies] = useState(1);
  const [price, setPrice] = useState(0);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setIsbn(book.isbn);
      setPublisher(book.publisher || "");
      setLanguage(book.language || "Persian");
      setDescription(book.description || "");
      setPublishedDate(book.published_date || "");
      setTotalCopies(book.total_copies || 1);
      setPrice(book.price || 0);
    }
    setCoverImage(null);
    setError("");
  }, [book, open]);

  if (!open || !book) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data: Partial<CreateBookData> = {
        title,
        author,
        isbn,
        publisher,
        language,
        description,
        published_date: publishedDate,
        total_copies: totalCopies,
        price,
        cover_image: coverImage,
      };
      await booksApi.updateBook(book.id, data);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره کتاب");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-4">ویرایش کتاب</h3>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">عنوان *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">نویسنده *</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ISBN *</label>
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ناشر</label>
              <input value={publisher} onChange={(e) => setPublisher(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">زبان</label>
              <input value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">تاریخ انتشار</label>
              <input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">تعداد نسخه</label>
              <input type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">قیمت (ریال)</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">توضیحات</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">تصویر جلد</label>
            <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50">
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ShelfRow {
  shelf_id: number;
  location: string;
  copies_in_shelf: number;
  borrowed_from_shelf: number;
  remaining_in_shelf: number;
  has_book: boolean;
}

interface BorrowerRow {
  id: number;
  borrower_username: string;
  borrowed_date: string;
  due_date: string;
  return_date: string | null;
  overdue_days: number;
  penalty: number;
  status: "active" | "returned" | "overdue";
}

function BookDetailsContent() {
  const router = useRouter();
  const params = useParams<{ bookId: string | string[] }>();
  const routeBookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;
  const bookId = Number(routeBookId);

  const [book, setBook] = useState<Book | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelfBooks, setShelfBooks] = useState<ShelfBook[]>([]);
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [shelfFilter, setShelfFilter] = useState<"all" | "has_book" | "no_book">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookData, shelvesData, shelfBooksData, borrowsData] = await Promise.all([
        booksApi.getBook(bookId),
        getShelves(),
        getShelfBooks(),
        getBorrows(),
      ]);
      setBook(bookData);
      setShelves(shelvesData);
      setShelfBooks(shelfBooksData);
      setBorrows(borrowsData);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "خطا در بارگذاری اطلاعات کتاب");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookId || Number.isNaN(bookId)) {
      setError("شناسه کتاب معتبر نیست.");
      setLoading(false);
      return;
    }
    loadAll();
  }, [bookId]);

  const shelfBookIdsForThisBook = useMemo(() => {
    const ids = new Set<number>();
    for (const sb of shelfBooks) {
      if (sb.book === bookId) ids.add(sb.id);
    }
    return ids;
  }, [shelfBooks, bookId]);

  const shelfBookByShelf = useMemo(() => {
    const map = new Map<number, ShelfBook>();
    for (const sb of shelfBooks) {
      if (sb.book === bookId) map.set(sb.shelf, sb);
    }
    return map;
  }, [shelfBooks, bookId]);

  const activeBorrowsByShelfBook = useMemo(() => {
    const map = new Map<number, number>();
    for (const b of borrows) {
      if (b.return_date) continue;
      map.set(b.shelf_book, (map.get(b.shelf_book) || 0) + 1);
    }
    return map;
  }, [borrows]);

  const shelfRows: ShelfRow[] = useMemo(() => {
    return shelves.map((shelf) => {
      const sb = shelfBookByShelf.get(shelf.id);
      const copies_in_shelf = sb ? sb.copies_in_shelf : 0;
      const borrowed_from_shelf = sb ? activeBorrowsByShelfBook.get(sb.id) || 0 : 0;
      const remaining_in_shelf = Math.max(copies_in_shelf - borrowed_from_shelf, 0);
      return {
        shelf_id: shelf.id,
        location: shelf.location,
        copies_in_shelf,
        borrowed_from_shelf,
        remaining_in_shelf,
        has_book: copies_in_shelf > 0,
      };
    });
  }, [shelves, shelfBookByShelf, activeBorrowsByShelfBook]);

  const filteredShelfRows = useMemo(() => {
    if (shelfFilter === "has_book") return shelfRows.filter((r) => r.has_book);
    if (shelfFilter === "no_book") return shelfRows.filter((r) => !r.has_book);
    return shelfRows;
  }, [shelfRows, shelfFilter]);

  const borrowerRows: BorrowerRow[] = useMemo(() => {
    const now = new Date();
    return borrows
      .filter((b) => shelfBookIdsForThisBook.has(b.shelf_book))
      .filter((b) => Boolean(b.borrower_username))
      .map((b) => {
        const dueDate = new Date(new Date(b.borrowed_date).getTime() + BORROW_DAYS * DAY_MS);
        const endDate = b.return_date ? new Date(b.return_date) : now;
        const overdueDays = Math.max(0, Math.floor((endDate.getTime() - dueDate.getTime()) / DAY_MS));
        const status: BorrowerRow["status"] = b.return_date ? "returned" : overdueDays > 0 ? "overdue" : "active";
        return {
          id: b.id,
          borrower_username: b.borrower_username || "—",
          borrowed_date: b.borrowed_date,
          due_date: dueDate.toISOString(),
          return_date: b.return_date,
          overdue_days: overdueDays,
          penalty: overdueDays * PENALTY_PER_DAY,
          status,
        };
      })
      .sort((a, b) => b.id - a.id);
  }, [borrows, shelfBookIdsForThisBook]);

  const activeBorrowedCount = borrowerRows.filter((r) => r.status !== "returned").length;
  const remainingCount = Math.max((book?.total_copies || 0) - activeBorrowedCount, 0);

  const shelfColumns: Column<ShelfRow>[] = [
    { key: "shelf_id", header: "شماره", render: (r) => r.shelf_id, className: "w-14" },
    { key: "location", header: "اسم قفسه", render: (r) => <span className="font-medium">{r.location}</span> },
    { key: "copies_in_shelf", header: "تعداد کتاب در قفسه", render: (r) => r.copies_in_shelf, className: "w-32 text-center" },
    { key: "borrowed_from_shelf", header: "قرض گرفته شده از قفسه", render: (r) => r.borrowed_from_shelf, className: "w-36 text-center" },
    { key: "remaining_in_shelf", header: "باقیمانده در قفسه", render: (r) => r.remaining_in_shelf, className: "w-32 text-center" },
  ];

  const borrowerColumns: Column<BorrowerRow>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "borrower_username", header: "دانشجو" },
    { key: "borrowed_date", header: "تاریخ امانت", render: (r) => toDateLabel(r.borrowed_date) },
    { key: "due_date", header: "سررسید", render: (r) => toDateLabel(r.due_date) },
    { key: "return_date", header: "تاریخ بازگشت", render: (r) => toDateLabel(r.return_date) },
    {
      key: "status",
      header: "وضعیت",
      render: (r) => {
        if (r.status === "returned") return <StatusBadge label="بازگردانده شده" variant="success" />;
        if (r.status === "overdue") return <StatusBadge label="معوقه" variant="danger" />;
        return <StatusBadge label="فعال" variant="info" />;
      },
    },
    { key: "overdue_days", header: "روز تاخیر", render: (r) => r.overdue_days || "—" },
    { key: "penalty", header: "جریمه", render: (r) => r.penalty > 0 ? toMoney(r.penalty) : "—" },
  ];

  const handleDelete = async () => {
    setDeleting(true);
    setActionError("");
    try {
      await booksApi.deleteBook(bookId);
      router.push("/librarian-dashboard/books");
    } catch (deleteError: unknown) {
      setActionError(deleteError instanceof Error ? deleteError.message : "خطا در حذف کتاب");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handlePrintQr = () => {
    if (!book?.qr_code_id) {
      setActionError("این کتاب کد QR ندارد.");
      return;
    }
    setActionError("");
    const qrUrl = getQrImageUrl(book.qr_code_id);
    const printWin = window.open("", "_blank");
    if (!printWin) {
      setActionError("پنجره پرینت مسدود شده است. لطفاً اجازه پاپ‌آپ را بدهید.");
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head><meta charset="UTF-8"><title>رمزینه پاسخ سریع - ${(book.title || "").replace(/</g, "&lt;")}</title>
      <style>body{text-align:center;padding:2rem;font-family:Tahoma,sans-serif;} img{width:200px;height:200px;}</style></head>
      <body>
        <h2>${(book.title || "").replace(/</g, "&lt;")}</h2>
        <p>${(book.author || "").replace(/</g, "&lt;")}</p>
        <img src="${qrUrl.replace(/"/g, "&quot;")}" alt="QR" onload="setTimeout(function(){window.print();window.close();},500)" onerror="setTimeout(function(){window.print();window.close();},500)" />
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div>
      <PageHeader
        title="پرونده کتاب"
        description={book ? `جزئیات کامل کتاب ${book.title}` : "جزئیات کتاب"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setEditOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">
              ویرایش کتاب
            </button>
            <button onClick={handlePrintQr} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-100">
              تولید رمزینه پاسخ سریع
            </button>
            <button onClick={() => setDeleteOpen(true)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
              حذف کتاب
            </button>
            <Link href="/librarian-dashboard/books" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              بازگشت به لیست کتاب‌ها
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">تعداد موجود</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{book?.total_copies ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">قرض گرفته شده</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{activeBorrowedCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">باقیمانده</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{remainingCount}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">مشخصات کامل کتاب</h2>
        <div className="flex flex-col md:flex-row gap-6">
          {getCoverImageUrl(book?.cover_image) && (
            <div className="flex-shrink-0">
              <img
                src={getCoverImageUrl(book?.cover_image)!}
                alt={`جلد ${book?.title || "کتاب"}`}
                className="w-40 h-56 object-cover rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          )}
          <div className="flex-1 grid gap-3 md:grid-cols-2 text-sm text-gray-700">
            <div>شماره: <span className="font-medium">{book?.id ?? "—"}</span></div>
            <div>عنوان: <span className="font-medium">{book?.title || "—"}</span></div>
            <div>نویسنده: <span className="font-medium">{book?.author || "—"}</span></div>
            <div>ISBN: <span className="font-medium">{book?.isbn || "—"}</span></div>
            <div>ناشر: <span className="font-medium">{book?.publisher || "—"}</span></div>
            <div>زبان: <span className="font-medium">{book?.language || "—"}</span></div>
            <div>تاریخ انتشار: <span className="font-medium">{toDateLabel(book?.published_date || null)}</span></div>
            <div>قیمت: <span className="font-medium">{toMoney(book?.price || 0)}</span></div>
            <div className="md:col-span-2">توضیحات: <span className="font-medium">{book?.description || "—"}</span></div>
            <div className="md:col-span-2">کد QR: <span className="font-medium">{book?.qr_code_id || "—"}</span></div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">موجودیت کتاب در قفسه‌ها</h2>
        <div className="flex gap-2 mb-4">
          {[
            { key: "all" as const, label: "همه قفسه‌ها" },
            { key: "has_book" as const, label: "قفسه‌های دارای کتاب" },
            { key: "no_book" as const, label: "قفسه‌های بدون کتاب" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setShelfFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                shelfFilter === tab.key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <DataTable
          columns={shelfColumns}
          data={filteredShelfRows}
          loading={loading}
          keyExtractor={(r) => r.shelf_id}
          emptyTitle="قفسه‌ای یافت نشد"
          emptyDescription="هنوز قفسه‌ای در کتابخانه تعریف نشده است."
        />
      </div>

      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">دانشجویان قرض‌گیرنده این کتاب</h2>
      </div>
      <DataTable
        columns={borrowerColumns}
        data={borrowerRows}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="رکورد امانتی برای این کتاب یافت نشد"
        emptyDescription="هیچ دانشجویی تاکنون این کتاب را قرض نگرفته است."
      />

      <BookModal open={editOpen} book={book} onClose={() => setEditOpen(false)} onSaved={loadAll} />
      <ConfirmDialog
        open={deleteOpen}
        title="حذف کتاب"
        message="آیا مطمئن هستید که می‌خواهید این کتاب را حذف کنید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export default function BookDetailsPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <BookDetailsContent />
    </DashboardLayout>
  );
}
