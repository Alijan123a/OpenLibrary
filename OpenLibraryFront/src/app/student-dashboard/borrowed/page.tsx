"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getBorrows, returnBook, getShelvesForReturn, type Borrow } from "@/lib/borrow";

function BorrowedContent() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnId, setReturnId] = useState<number | null>(null);
  const [returning, setReturning] = useState(false);
  const [shelves, setShelves] = useState<{ id: number; location: string }[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [returnError, setReturnError] = useState("");

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

  useEffect(() => {
    if (returnId !== null) {
      setReturnError("");
      setSelectedShelfId(null);
      getShelvesForReturn()
        .then(setShelves)
        .catch(() => setShelves([]));
    }
  }, [returnId]);

  const handleReturn = async () => {
    if (returnId === null) return;
    if (selectedShelfId === null) {
      setReturnError("لطفاً قفسه مقصد را انتخاب کنید.");
      return;
    }
    setReturning(true);
    setReturnError("");
    try {
      await returnBook(returnId, selectedShelfId);
      fetchBorrows();
      setReturnId(null);
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "خطا در بازگرداندن کتاب");
    }
    setReturning(false);
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
    { key: "book_title", header: "عنوان", render: (r) => <span className="font-medium">{r.book_title ?? "—"}</span> },
    { key: "book_author", header: "نویسنده", render: (r) => r.book_author ?? "—" },
    { key: "shelf_location", header: "قفسه", render: (r) => r.shelf_location ?? "—" },
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
      {returnId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setReturnId(null)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">بازگرداندن کتاب</h3>
            <p className="text-sm text-gray-600 mb-3">قفسه‌ای را که کتاب به آن بازگردانده می‌شود انتخاب کنید:</p>
            <select
              value={selectedShelfId ?? ""}
              onChange={(e) => setSelectedShelfId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 mb-4"
            >
              <option value="">— انتخاب قفسه —</option>
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.location}
                </option>
              ))}
            </select>
            {returnError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {returnError}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReturn}
                disabled={returning || selectedShelfId === null}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
              >
                {returning ? "در حال بازگرداندن..." : "بازگرداندن"}
              </button>
              <button
                onClick={() => setReturnId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
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
