"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getBorrows, type Borrow } from "@/lib/borrow";
import { booksApi, type Book } from "@/lib/books";

interface OverdueRow {
  id: number;
  borrower: string;
  shelfBook: number;
  borrowedDate: string;
  daysOverdue: number;
}

function ReportsContent() {
  const [overdueRows, setOverdueRows] = useState<OverdueRow[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

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
            return {
              id: b.id,
              borrower: b.borrower_username || "—",
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

  const overdueColumns: Column<OverdueRow>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "borrower", header: "کاربر" },
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
        <DataTable
          columns={overdueColumns}
          data={overdueRows}
          loading={loading}
          keyExtractor={(r) => r.id}
          emptyTitle="تاخیری وجود ندارد"
          emptyDescription="هیچ امانت معوقه‌ای یافت نشد."
        />
      </div>

      {/* Inventory report */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">وضعیت موجودی کتاب‌ها</h2>
        <DataTable
          columns={inventoryColumns}
          data={books}
          loading={loading}
          keyExtractor={(r) => r.id}
          emptyTitle="کتابی وجود ندارد"
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
