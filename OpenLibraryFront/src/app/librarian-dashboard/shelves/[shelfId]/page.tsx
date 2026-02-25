"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { booksApi, type Book } from "@/lib/books";
import { getShelves, getShelfBooks, type Shelf, type ShelfBook } from "@/lib/shelves";
import { getBorrows, type Borrow } from "@/lib/borrow";

interface ShelfBookRow {
  shelf_book_id: number;
  book_id: number;
  title: string;
  author: string;
  copies_in_shelf: number;
  borrowed: number;
  remaining: number;
}

function ShelfBooksContent() {
  const params = useParams<{ shelfId: string | string[] }>();
  const searchParams = useSearchParams();
  const routeShelfId = Array.isArray(params.shelfId) ? params.shelfId[0] : params.shelfId;
  const shelfId = Number(routeShelfId);
  const bookIdFromQuery = searchParams.get("bookId");
  const titleFromQuery = searchParams.get("title");
  const initialBookId = bookIdFromQuery ? Number(bookIdFromQuery) : null;
  const initialTitle = titleFromQuery ?? "";

  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [shelfBooks, setShelfBooks] = useState<ShelfBook[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTitle, setFilterTitle] = useState(initialTitle);
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterMinBorrowed, setFilterMinBorrowed] = useState<string>("");
  const [filterMinRemaining, setFilterMinRemaining] = useState<string>("");
  const [filterBookId, setFilterBookId] = useState<number | null>(initialBookId);
  const [sortKey, setSortKey] = useState<string>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
  };

  useEffect(() => {
    setFilterBookId(initialBookId);
    setFilterTitle(initialTitle);
  }, [initialBookId, initialTitle]);

  const loadAll = useCallback(async () => {
    if (!shelfId || Number.isNaN(shelfId)) {
      setError("شناسه قفسه معتبر نیست.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [shelvesData, shelfBooksData, booksData, borrowsData] = await Promise.all([
        getShelves(),
        getShelfBooks(),
        booksApi.getBooks(),
        getBorrows(),
      ]);
      const foundShelf = shelvesData.find((s) => s.id === shelfId);
      setShelf(foundShelf || null);
      setShelfBooks(shelfBooksData);
      setBooks(booksData);
      setBorrows(borrowsData);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "خطا در بارگذاری اطلاعات قفسه");
    } finally {
      setLoading(false);
    }
  }, [shelfId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Refetch when tab becomes visible (e.g. after returning a book on loans page)
  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === "visible") loadAll(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadAll]);

  const bookMap = useMemo(() => {
    const map = new Map<number, Book>();
    for (const b of books) map.set(b.id, b);
    return map;
  }, [books]);

  const shelfBooksForThisShelf = useMemo(() => {
    return shelfBooks.filter((sb) => sb.shelf === shelfId);
  }, [shelfBooks, shelfId]);

  const activeBorrowsByShelfBook = useMemo(() => {
    const map = new Map<number, number>();
    for (const b of borrows) {
      if (b.return_date) continue;
      map.set(b.shelf_book, (map.get(b.shelf_book) || 0) + 1);
    }
    return map;
  }, [borrows]);

  const allRows: ShelfBookRow[] = useMemo(() => {
    return shelfBooksForThisShelf.map((sb) => {
      const book = bookMap.get(sb.book);
      const borrowed = activeBorrowsByShelfBook.get(sb.id) || 0;
      const remaining = Math.max(sb.copies_in_shelf - borrowed, 0);
      return {
        shelf_book_id: sb.id,
        book_id: sb.book,
        title: book?.title || `کتاب #${sb.book}`,
        author: book?.author || "—",
        copies_in_shelf: sb.copies_in_shelf,
        borrowed,
        remaining,
      };
    });
  }, [shelfBooksForThisShelf, bookMap, activeBorrowsByShelfBook]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (filterBookId != null && r.book_id !== filterBookId) return false;
      if (filterTitle.trim()) {
        const t = filterTitle.trim().toLowerCase();
        if (!r.title.toLowerCase().includes(t)) return false;
      }
      if (filterAuthor.trim()) {
        const a = filterAuthor.trim().toLowerCase();
        if (!r.author.toLowerCase().includes(a)) return false;
      }
      const minBorrowed = filterMinBorrowed === "" ? null : Number(filterMinBorrowed);
      if (minBorrowed != null && !Number.isNaN(minBorrowed) && r.borrowed < minBorrowed) return false;
      const minRem = filterMinRemaining === "" ? null : Number(filterMinRemaining);
      if (minRem != null && !Number.isNaN(minRem) && r.remaining < minRem) return false;
      return true;
    });
  }, [allRows, filterBookId, filterTitle, filterAuthor, filterMinBorrowed, filterMinRemaining]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = (a as Record<string, unknown>)[sortKey] ?? "";
      const vb = (b as Record<string, unknown>)[sortKey] ?? "";
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return cmp * dir;
    });
  }, [filteredRows, sortKey, sortDir]);

  const stats = useMemo(() => {
    let totalCopies = 0;
    let totalBorrowed = 0;
    let totalRemaining = 0;
    for (const r of filteredRows) {
      totalCopies += r.copies_in_shelf;
      totalBorrowed += r.borrowed;
      totalRemaining += r.remaining;
    }
    return { totalCopies, totalBorrowed, totalRemaining };
  }, [filteredRows]);

  const columns: Column<ShelfBookRow>[] = [
    { key: "book_id", header: "#", render: (r) => r.book_id, className: "w-14" },
    { key: "title", header: "عنوان", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "author", header: "نویسنده", render: (r) => r.author },
    { key: "copies_in_shelf", header: "تعداد در قفسه", render: (r) => r.copies_in_shelf, className: "w-28 text-center" },
    { key: "borrowed", header: "قرض گرفته شده", render: (r) => r.borrowed, className: "w-32 text-center" },
    { key: "remaining", header: "باقیمانده", render: (r) => r.remaining, className: "w-24 text-center" },
    {
      key: "link",
      header: "",
      render: (r) => (
        <Link href={`/librarian-dashboard/books/${r.book_id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          مشاهده کتاب
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`کتاب‌های قفسه ${shelf?.location || ""}`}
        description={shelf ? `همه کتاب‌های موجود در قفسه ${shelf.location}` : "جزئیات قفسه"}
        action={
          <Link href="/librarian-dashboard/shelves" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            بازگشت به لیست قفسه‌ها
          </Link>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-4 min-h-[80px] flex flex-col justify-center">
          <p className="text-xs text-gray-500 mb-0.5">تعداد کل نسخه‌ها</p>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.totalCopies}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-4 min-h-[80px] flex flex-col justify-center">
          <p className="text-xs text-gray-500 mb-0.5">قرض گرفته شده</p>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.totalBorrowed}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-4 min-h-[80px] flex flex-col justify-center">
          <p className="text-xs text-gray-500 mb-0.5">باقیمانده</p>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.totalRemaining}</p>
        </div>
      </div>

      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">فیلتر</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">عنوان</label>
            <input
              type="text"
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              placeholder="جستجو در عنوان..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">نویسنده</label>
            <input
              type="text"
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              placeholder="جستجو در نویسنده..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs text-gray-500 mb-1">حداقل قرض گرفته شده</label>
            <input
              type="number"
              min={0}
              value={filterMinBorrowed}
              onChange={(e) => setFilterMinBorrowed(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs text-gray-500 mb-1">حداقل باقیمانده</label>
            <input
              type="number"
              min={0}
              value={filterMinRemaining}
              onChange={(e) => setFilterMinRemaining(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <button
            onClick={() => {
              setFilterTitle("");
              setFilterAuthor("");
              setFilterMinBorrowed("");
              setFilterMinRemaining("");
              setFilterBookId(null);
            }}
            className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sortedRows}
        loading={loading}
        keyExtractor={(r) => r.shelf_book_id}
        emptyTitle="کتابی یافت نشد"
        emptyDescription="هیچ کتابی با این فیلترها در قفسه وجود ندارد. فیلترها را تغییر دهید یا پاک کنید."
        sortableKeys={["book_id", "title", "author", "copies_in_shelf", "borrowed", "remaining"]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </div>
  );
}

export default function ShelfBooksPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <ShelfBooksContent />
    </DashboardLayout>
  );
}
