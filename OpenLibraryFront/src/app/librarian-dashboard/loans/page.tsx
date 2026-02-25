"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getBorrows, returnBook, getShelvesForReturn, type Borrow } from "@/lib/borrow";

function LoansContent() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [returnId, setReturnId] = useState<number | null>(null);

  const handleSort = (key: string) => {
    setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "desc"));
    setSortKey(key);
  };
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
    if (b.return_date) return { label: "بازگردانده شده", variant: "success" as const, key: "returned" };
    const due = new Date(new Date(b.borrowed_date).getTime() + 14 * 24 * 60 * 60 * 1000);
    if (new Date() > due) return { label: "معوقه", variant: "danger" as const, key: "overdue" };
    return { label: "فعال", variant: "info" as const, key: "active" };
  };

  const filtered = useMemo(() => {
    return borrows.filter((b) => {
      if (filter !== "all" && getStatus(b).key !== filter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const un = (b.borrower_username ?? "").toLowerCase();
      const sn = (b.borrower_student_number ?? "").toLowerCase();
      const loc = (b.shelf_location ?? "").toLowerCase();
      const title = (b.book_title ?? "").toLowerCase();
      const author = (b.book_author ?? "").toLowerCase();
      return un.includes(q) || sn.includes(q) || loc.includes(q) || title.includes(q) || author.includes(q) || String(b.id).includes(q);
    });
  }, [borrows, filter, search]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let va: string | number | null = (a as Record<string, unknown>)[sortKey] ?? "";
      let vb: string | number | null = (b as Record<string, unknown>)[sortKey] ?? "";
      if (sortKey === "borrowed_date" || sortKey === "id") {
        va = va ? new Date(String(va)).getTime() : 0;
        vb = vb ? new Date(String(vb)).getTime() : 0;
      }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const columns: Column<Borrow>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "borrower_username", header: "دانشجو", render: (r) => r.borrower_username ?? "—" },
    { key: "borrower_student_number", header: "شماره دانشجویی", render: (r) => r.borrower_student_number ?? "—" },
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
      <PageHeader title="امانت‌های فعال" description="لیست تمامی امانت‌های کتابخانه" />

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="جستجو: دانشجو، شماره دانشجویی، قفسه، عنوان کتاب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
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
        data={sortedRows}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="امانتی یافت نشد"
        sortableKeys={["id", "borrower_username", "borrower_student_number", "shelf_location", "borrowed_date"]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
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

export default function LoansPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <LoansContent />
    </DashboardLayout>
  );
}
