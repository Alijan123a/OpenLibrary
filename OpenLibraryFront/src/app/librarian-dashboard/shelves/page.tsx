"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getShelves, createShelf, updateShelf, deleteShelf, type Shelf } from "@/lib/shelves";

/* ── Shelf form modal ── */
function ShelfModal({
  open,
  shelf,
  onClose,
  onSaved,
}: {
  open: boolean;
  shelf: Shelf | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shelf) {
      setLocation(shelf.location);
      setCapacity(shelf.capacity);
    } else {
      setLocation("");
      setCapacity(50);
    }
    setError("");
  }, [shelf, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (shelf) {
        await updateShelf(shelf.id, { location, capacity });
      } else {
        await createShelf({ location, capacity });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره قفسه");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{shelf ? "ویرایش قفسه" : "افزودن قفسه"}</h3>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">موقعیت *</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" placeholder="مثال: طبقه ۲ - ردیف A" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ظرفیت</label>
            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50">
              {saving ? "..." : shelf ? "ذخیره" : "افزودن"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Shelves page ── */
function ShelvesContent() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchShelves = () => {
    setLoading(true);
    getShelves().then(setShelves).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchShelves(); }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try { await deleteShelf(deleteId); fetchShelves(); } catch { /* ignore */ }
    setDeleting(false);
    setDeleteId(null);
  };

  const columns: Column<Shelf>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "location", header: "موقعیت", render: (r) => <span className="font-medium">{r.location}</span> },
    { key: "capacity", header: "ظرفیت", className: "w-20 text-center" },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/librarian-dashboard/shelves/${r.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            مشاهده کتاب‌ها
          </Link>
          <button onClick={() => { setEditingShelf(r); setModalOpen(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">ویرایش</button>
          <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">حذف</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="مدیریت قفسه‌ها"
        description="قفسه‌های کتابخانه و ظرفیت آنها"
        action={
          <button onClick={() => { setEditingShelf(null); setModalOpen(true); }} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">
            افزودن قفسه
          </button>
        }
      />
      <DataTable columns={columns} data={shelves} loading={loading} keyExtractor={(r) => r.id} emptyTitle="قفسه‌ای یافت نشد" />
      <ShelfModal open={modalOpen} shelf={editingShelf} onClose={() => setModalOpen(false)} onSaved={fetchShelves} />
      <ConfirmDialog
        open={deleteId !== null}
        title="حذف قفسه"
        message="آیا مطمئن هستید که می‌خواهید این قفسه را حذف کنید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function ShelvesPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <ShelvesContent />
    </DashboardLayout>
  );
}
