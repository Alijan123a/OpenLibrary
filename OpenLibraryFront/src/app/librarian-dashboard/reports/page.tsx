"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getBorrows, type Borrow } from "@/lib/borrow";
import { booksApi, type Book } from "@/lib/books";

interface OverdueRow {
  id: number;
  borrower: string;
  borrowerStudentNumber?: string | null;
  shelfBook: number;
  borrowedDate: string;
  daysOverdue: number;
}

function ReportsContent() {
  const [overdueRows, setOverdueRows] = useState<OverdueRow[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueSearch, setOverdueSearch] = useState("");
  const [overdueSortKey, setOverdueSortKey] = useState<string>("daysOverdue");
  const [overdueSortDir, setOverdueSortDir] = useState<"asc" | "desc">("desc");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventorySortKey, setInventorySortKey] = useState<string>("title");
  const [inventorySortDir, setInventorySortDir] = useState<"asc" | "desc">("asc");

  const handleOverdueSort = (key: string) => {
    setOverdueSortDir((d) => (overdueSortKey === key ? (d === "asc" ? "desc" : "asc") : "desc"));
    setOverdueSortKey(key);
  };
  const handleInventorySort = (key: string) => {
    setInventorySortDir((d) => (inventorySortKey === key ? (d === "asc" ? "desc" : "asc") : "asc"));
    setInventorySortKey(key);
  };

  useEffect(() => {
    async function load() {
      try {
        const [borrows, booksData] = await Promise.all([getBorrows(), booksApi.getBooks()]);
        setBooks(booksData);

        const now = new Date();
        const rows: OverdueRow[] = borrows
          .filter((b) => !b.return_date)
          .map((b) => {
            const due = new Date(new Date(b.borrowed_date).getTime() + 14 * 24 * 60 * 60 * 1000);
            const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
            const borrowerName = b.borrower_username || "—";
            const borrowerDisplay = b.borrower_student_number ? `${borrowerName} (${b.borrower_student_number})` : borrowerName;
            return {
              id: b.id,
              borrower: borrowerDisplay,
              borrowerStudentNumber: b.borrower_student_number,
              shelfBook: b.shelf_book,
              borrowedDate: b.borrowed_date,
              daysOverdue,
            };
          })
          .filter((r) => r.daysOverdue > 0);

        setOverdueRows(rows);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const filteredOverdue = useMemo(() => {
    const q = overdueSearch.trim().toLowerCase();
    if (!q) return overdueRows;
    return overdueRows.filter(
      (r) =>
        r.borrower.toLowerCase().includes(q) ||
        String(r.shelfBook).includes(q) ||
        String(r.id).includes(q) ||
        String(r.daysOverdue).includes(q)
    );
  }, [overdueRows, overdueSearch]);

  const sortedOverdue = useMemo(() => {
    const dir = overdueSortDir === "asc" ? 1 : -1;
    return [...filteredOverdue].sort((a, b) => {
      const va = (a as any)[overdueSortKey] ?? "";
      const vb = (b as any)[overdueSortKey] ?? "";
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return cmp * dir;
    });
  }, [filteredOverdue, overdueSortKey, overdueSortDir]);

  const filteredInventory = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        (b.title ?? "").toLowerCase().includes(q) ||
        (b.author ?? "").toLowerCase().includes(q) ||
        String(b.id).includes(q) ||
        String(b.total_copies).includes(q)
    );
  }, [books, inventorySearch]);

  const sortedInventory = useMemo(() => {
    const dir = inventorySortDir === "asc" ? 1 : -1;
    return [...filteredInventory].sort((a, b) => {
      let va = (a as any)[inventorySortKey] ?? "";
      let vb = (b as any)[inventorySortKey] ?? "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return cmp * dir;
    });
  }, [filteredInventory, inventorySortKey, inventorySortDir]);

  const overdueColumns: Column<OverdueRow>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "borrower", header: "دانشجو" },
    { key: "shelfBook", header: "قفسه-کتاب", render: (r) => r.shelfBook },
    {
      key: "borrowedDate",
      header: "تاریخ امانت",
      render: (r) => new Date(r.borrowedDate).toLocaleDateString("fa-IR"),
    },
    {
      key: "daysOverdue",
      header: "روز تاخیر",
      render: (r) => <StatusBadge label={`${r.daysOverdue} روز`} variant="danger" />,
    },
  ];

  const inventoryColumns: Column<Book>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "title", header: "عنوان", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "author", header: "نویسنده" },
    { key: "total_copies", header: "تعداد نسخه", className: "w-20 text-center" },
  ];

  return (
    <div>
      <PageHeader title="گزارش‌ها" description="گزارش جریمه‌ها و وضعیت موجودی" />

      {/* Overdue report */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">امانت‌های معوقه (جریمه)</h2>
        <div className="mb-3">
          <input
            type="search"
            placeholder="جستجو: دانشجو، قفسه، شماره..."
            value={overdueSearch}
            onChange={(e) => setOverdueSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <DataTable
          columns={overdueColumns}
          data={sortedOverdue}
          loading={loading}
          keyExtractor={(r) => r.id}
          emptyTitle="تاخیری وجود ندارد"
          emptyDescription="هیچ امانت معوقه‌ای یافت نشد."
          sortableKeys={["id", "borrower", "shelfBook", "borrowedDate", "daysOverdue"]}
          sortKey={overdueSortKey}
          sortDir={overdueSortDir}
          onSort={handleOverdueSort}
        />
      </div>

      {/* Inventory report */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">وضعیت موجودی کتاب‌ها</h2>
        <div className="mb-3">
          <input
            type="search"
            placeholder="جستجو: عنوان، نویسنده، شماره..."
            value={inventorySearch}
            onChange={(e) => setInventorySearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <DataTable
          columns={inventoryColumns}
          data={sortedInventory}
          loading={loading}
          keyExtractor={(r) => r.id}
          emptyTitle="کتابی وجود ندارد"
          sortableKeys={["id", "title", "author", "total_copies"]}
          sortKey={inventorySortKey}
          sortDir={inventorySortDir}
          onSort={handleInventorySort}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <ReportsContent />
    </DashboardLayout>
  );
}