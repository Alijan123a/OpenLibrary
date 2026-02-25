"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getUsers, createUser, updateUser, type User } from "@/lib/users";

/* ── Student form modal ── */
function StudentModal({
  open,
  student,
  onClose,
  onSaved,
}: {
  open: boolean;
  student: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setUsername(student.username);
      setEmail(student.email);
      setStudentNumber(student.student_number ?? "");
      setPassword("");
    } else {
      setUsername("");
      setEmail("");
      setStudentNumber("");
      setPassword("");
    }
    setError("");
  }, [student, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (student) {
        await updateUser(student.id, { username, email, student_number: studentNumber.trim() || undefined });
      } else {
        if (!password) { setError("رمز عبور الزامی است"); setSaving(false); return; }
        if (!studentNumber.trim()) { setError("شماره دانشجویی الزامی است"); setSaving(false); return; }
        await createUser({ username, password, email, role: "student", student_number: studentNumber.trim() });
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
          {student ? "ویرایش دانشجو" : "افزودن دانشجو"}
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">شماره دانشجویی {!student && "*"}</label>
            <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required={!student} placeholder="مثال: 12345678" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          {!student && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">رمز عبور *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50">
              {saving ? "..." : student ? "ذخیره" : "افزودن"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Students page ── */
function StudentsContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<string>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
  };

  const fetchUsers = () => {
    setLoading(true);
    getUsers("student")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (!normalizedSearch) return true;
        const username = user.username?.toLowerCase() || "";
        const email = user.email?.toLowerCase() || "";
        const studentNumber = user.student_number?.toLowerCase() || "";
        return username.includes(normalizedSearch) || email.includes(normalizedSearch) || studentNumber.includes(normalizedSearch) || String(user.id).includes(normalizedSearch);
      }),
    [users, normalizedSearch]
  );

  const sortedUsers = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredUsers].sort((a, b) => {
      const va = (a as Record<string, unknown>)[sortKey] ?? "";
      const vb = (b as Record<string, unknown>)[sortKey] ?? "";
      const aStr = String(va).toLowerCase();
      const bStr = String(vb).toLowerCase();
      const cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      return cmp * dir;
    });
  }, [filteredUsers, sortKey, sortDir]);

  const studentDisplay = (r: User) =>
    r.student_number ? `${r.username} (${r.student_number})` : r.username;

  const columns: Column<User>[] = [
    { key: "id", header: "#", render: (r) => r.id, className: "w-12" },
    { key: "username", header: "دانشجو", render: (r) => <span className="font-medium">{studentDisplay(r)}</span> },
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
          <Link
            href={`/librarian-dashboard/students/${r.id}?username=${encodeURIComponent(r.username)}&email=${encodeURIComponent(r.email || "")}&student_number=${encodeURIComponent(r.student_number || "")}`}
            className="text-xs text-gray-700 hover:text-gray-900 font-medium"
          >
            مشاهده
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="مدیریت دانشجویان"
        description="لیست حساب‌های کاربری دانشجویان"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="جستجو بر اساس نام کاربری، ایمیل یا شناسه"
              className="w-full min-w-0 sm:w-72 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button onClick={() => setModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg">
              افزودن دانشجو
            </button>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={sortedUsers}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyTitle="دانشجویی یافت نشد"
        sortableKeys={["id", "username", "email", "is_active"]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />
      <StudentModal open={modalOpen} student={null} onClose={() => setModalOpen(false)} onSaved={fetchUsers} />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <StudentsContent />
    </DashboardLayout>
  );
}
