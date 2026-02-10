"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getBorrows, returnBook, type Borrow } from "@/lib/borrow";

function BorrowedContent() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnId, setReturnId] = useState<number | null>(null);
  const [returning, setReturning] = useState(false);

  const fetchBorrows = () => {
    setLoading(true);
    getBorrows()
      .then(setBorrows)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBorrows();
  }, []);

  const handleReturn = async () => {
    if (returnId === null) return;
    setReturning(true);
    try {
      await returnBook(returnId);
      fetchBorrows();
    } catch {
      /* ignore */
    }
    setReturning(false);
    setReturnId(null);
  };

  const getStatus = (b: Borrow) => {
    if (b.return_date) return { label: "بازگردانده شده", variant: "success" as const };
    const borrowed = new Date(b.borrowed_date);
    const dueDate = new Date(borrowed.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (new Date() > dueDate) return { label: "معوقه", variant: "danger" as const };
    return { label: "فعال", variant: "info" as const };
  };

  const columns: Column<Borrow>[] = [
    { key: "id", header: "شناسه", render: (r) => `#${r.id}` },
    { key: "shelf_book", header: "شناسه قفسه‌-کتاب", render: (r) => r.shelf_book },
    {
      key: "borrowed_date",
      header: "تاریخ امانت",
      render: (r) => new Date(r.borrowed_date).toLocaleDateString("fa-IR"),
    },
    {
      key: "due_date",
      header: "سررسید",
      render: (r) => {
        const due = new Date(new Date(r.borrowed_date).getTime() + 14 * 24 * 60 * 60 * 1000);
        return due.toLocaleDateString("fa-IR");
      },
    },
    {
      key: "status",
      header: "وضعیت",
      render: (r) => {
        const s = getStatus(r);
        return <StatusBadge label={s.label} variant={s.variant} />;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        !r.return_date ? (
          <button
            onClick={() => setReturnId(r.id)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            بازگرداندن
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="کتاب‌های امانی" description="لیست کتاب‌هایی که به امانت گرفته‌اید" />
      <DataTable
        columns={columns}
        data={borrows}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="امانتی وجود ندارد"
        emptyDescription="شما هنوز کتابی به امانت نگرفته‌اید."
      />
      <ConfirmDialog
        open={returnId !== null}
        title="بازگرداندن کتاب"
        message="آیا مطمئن هستید که می‌خواهید این کتاب را بازگردانید؟"
        confirmLabel="بازگرداندن"
        onConfirm={handleReturn}
        onCancel={() => setReturnId(null)}
        loading={returning}
      />
    </div>
  );
}

export default function BorrowedPage() {
  return (
    <DashboardLayout allowedRoles={["student"]}>
      <BorrowedContent />
    </DashboardLayout>
  );
}
