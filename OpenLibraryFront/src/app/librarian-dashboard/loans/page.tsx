"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getBorrows, type Borrow } from "@/lib/borrow";

function LoansContent() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("all");

  useEffect(() => {
    getBorrows()
      .then(setBorrows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (b: Borrow) => {
    if (b.return_date) return { label: "بازگردانده شده", variant: "success" as const, key: "returned" };
    const due = new Date(new Date(b.borrowed_date).getTime() + 14 * 24 * 60 * 60 * 1000);
    if (new Date() > due) return { label: "معوقه", variant: "danger" as const, key: "overdue" };
    return { label: "فعال", variant: "info" as const, key: "active" };
  };

  const filtered = borrows.filter((b) => {
    if (filter === "all") return true;
    return getStatus(b).key === filter;
  });

  const borrowerDisplay = (r: Borrow) => {
    const name = r.borrower_username || "—";
    const num = r.borrower_student_number;
    return num ? `${name} (${num})` : name;
  };

  const columns: Column<Borrow>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "borrower_username", header: "دانشجو", render: (r) => borrowerDisplay(r) },
    { key: "shelf_book", header: "قفسه‌-کتاب", render: (r) => r.shelf_book },
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
  ];

  return (
    <div>
      <PageHeader title="امانت‌های فعال" description="لیست تمامی امانت‌های کتابخانه" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "همه" },
          { key: "active", label: "فعال" },
          { key: "overdue", label: "معوقه" },
          { key: "returned", label: "بازگردانده" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === tab.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="امانتی یافت نشد"
      />
    </div>
  );
}

export default function LoansPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <LoansContent />
    </DashboardLayout>
  );
}
