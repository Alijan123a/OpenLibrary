"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import { getUsers, createUser, updateUser, deleteUser, type User } from "@/lib/users";

/* ── Librarian form modal ── */
function LibrarianModal({
  open,
  librarian,
  onClose,
  onSaved,
}: {
  open: boolean;
  librarian: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (librarian) {
      setUsername(librarian.username);
      setEmail(librarian.email);
      setPassword("");
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
    }
    setError("");
  }, [librarian, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (librarian) {
        await updateUser(librarian.id, { username, email });
      } else {
        if (!password) { setError("رمز عبور الزامی است"); setSaving(false); return; }
        await createUser({ username, password, email, role: "librarian" });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {librarian ? "ویرایش کتابدار" : "افزودن کتابدار"}
        </h3>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نام کاربری *</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ایمیل</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          {!librarian && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">رمز عبور *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50">
              {saving ? "..." : librarian ? "ذخیره" : "افزودن"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Librarians page ── */
function LibrariansContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    getUsers("librarian")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    await deleteUser(deleteId);
    fetchUsers();
    setDeleting(false);
    setDeleteId(null);
  };

  const columns: Column<User>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "username", header: "نام کاربری", render: (r) => <span className="font-medium">{r.username}</span> },
    { key: "email", header: "ایمیل" },
    {
      key: "is_active",
      header: "وضعیت",
      render: (r) => (
        <StatusBadge label={r.is_active ? "فعال" : "غیرفعال"} variant={r.is_active ? "success" : "default"} />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => { setEditingUser(r); setModalOpen(true); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">ویرایش</button>
          <button onClick={() => setDeleteId(r.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">حذف</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="مدیریت کتابداران"
        description="لیست حساب‌های کاربری کتابداران"
        action={
          <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">
            افزودن کتابدار
          </button>
        }
      />
      <DataTable columns={columns} data={users} loading={loading} keyExtractor={(r) => r.id} emptyTitle="کتابداری یافت نشد" />
      <LibrarianModal open={modalOpen} librarian={editingUser} onClose={() => setModalOpen(false)} onSaved={fetchUsers} />
      <ConfirmDialog
        open={deleteId !== null}
        title="حذف کتابدار"
        message="آیا مطمئن هستید که می‌خواهید این حساب کاربری را حذف کنید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function LibrariansPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <LibrariansContent />
    </DashboardLayout>
  );
}
