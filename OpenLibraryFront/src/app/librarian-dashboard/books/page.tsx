"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { booksApi, type Book, type CreateBookData } from "@/lib/books";
import { getQrImageUrl } from "@/lib/qr";

/* ── Book form modal ── */
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
      setPublishedDate(book.publishedDate || "");
      setTotalCopies(book.totalCopies || 1);
      setPrice(book.price || 0);
    } else {
      setTitle(""); setAuthor(""); setIsbn(""); setPublisher(""); setLanguage("Persian");
      setDescription(""); setPublishedDate(""); setTotalCopies(1); setPrice(0);
    }
    setCoverImage(null);
    setError("");
  }, [book, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data: CreateBookData = {
        title, author, isbn, publisher, language, description, publishedDate, totalCopies, price, coverImage,
      };
      if (book) {
        await booksApi.updateBook(book.id, data);
      } else {
        await booksApi.createBook(data);
      }
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
        <h3 className="text-base font-semibold text-gray-900 mb-4">{book ? "ویرایش کتاب" : "افزودن کتاب جدید"}</h3>
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
              {saving ? "در حال ذخیره..." : book ? "ذخیره تغییرات" : "افزودن کتاب"}
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

/* ── Books page ── */
function BooksContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBooks = () => {
    setLoading(true);
    booksApi.getBooks().then(setBooks).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await booksApi.deleteBook(deleteId);
      fetchBooks();
    } catch { /* ignore */ }
    setDeleting(false);
    setDeleteId(null);
  };

  const filtered = books.filter(
    (b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Book>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "title", header: "عنوان", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "author", header: "نویسنده" },
    { key: "isbn", header: "ISBN", className: "font-mono text-xs" },
    { key: "totalCopies", header: "نسخه", className: "w-16 text-center" },
    {
      key: "qr",
      header: "QR",
      className: "w-16",
      render: (r) => {
        // Use qr_code_id from the API response
        const qrId = (r as unknown as Record<string, unknown>).qr_code_id as string | undefined;
        if (!qrId) return "—";
        return (
          <img src={getQrImageUrl(qrId)} alt="QR" className="w-10 h-10" />
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingBook(r); setModalOpen(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">ویرایش</button>
          <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">حذف</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="مدیریت کتاب‌ها"
        description="لیست تمامی کتاب‌های کتابخانه"
        action={
          <button
            onClick={() => { setEditingBook(null); setModalOpen(true); }}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg"
          >
            افزودن کتاب
          </button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="جستجو بر اساس عنوان یا نویسنده..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="کتابی یافت نشد"
        emptyDescription="هنوز کتابی در کتابخانه ثبت نشده است."
      />

      <BookModal
        open={modalOpen}
        book={editingBook}
        onClose={() => setModalOpen(false)}
        onSaved={fetchBooks}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف کتاب"
        message="آیا مطمئن هستید که می‌خواهید این کتاب را حذف کنید؟ این عمل قابل بازگشت نیست."
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function BooksPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <BooksContent />
    </DashboardLayout>
  );
}
