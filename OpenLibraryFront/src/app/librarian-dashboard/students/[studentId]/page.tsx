"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getUserById, updateUser, deleteUser, type User } from "@/lib/users";
import { getBorrows } from "@/lib/borrow";

const BORROW_DAYS = 14;
const PENALTY_PER_DAY = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface StudentBorrowRow {
  id: number;
  shelf_book: number;
  borrowed_date: string;
  due_date: string;
  return_date: string | null;
  status: "active" | "returned" | "overdue";
  overdue_days: number;
  penalty: number;
}

function toDateLabel(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fa-IR");
}

function toMoney(amount: number) {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ریال`;
}

function EditStudentModal({
  open,
  user,
  saving,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  user: User | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (payload: { username: string; email: string; student_number?: string }) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setStudentNumber(user?.student_number ?? "");
  }, [open, user]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ username, email, student_number: studentNumber.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">ویرایش دانشجو</h3>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">شماره دانشجویی</label>
            <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="مثال: 12345678" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50">
              {saving ? "..." : "ذخیره"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentDetailsContent() {
  const router = useRouter();
  const params = useParams<{ studentId: string | string[] }>();
  const searchParams = useSearchParams();
  const routeStudentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
  const studentId = Number(routeStudentId);

  const [student, setStudent] = useState<User | null>(null);
  const [rows, setRows] = useState<StudentBorrowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [actionError, setActionError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!studentId || Number.isNaN(studentId)) {
      setError("شناسه دانشجو معتبر نیست.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");
      setWarning("");

      const fallbackUsername = searchParams.get("username") || "";
      const fallbackEmail = searchParams.get("email") || "";
      if (fallbackUsername || fallbackEmail) {
        setStudent({
          id: studentId,
          username: fallbackUsername || `student-${studentId}`,
          email: fallbackEmail,
          role: "student",
          is_active: true,
          student_number: searchParams.get("student_number") ?? undefined,
        });
      }

      let studentData: User | null = null;
      try {
        studentData = await getUserById(studentId);
        setStudent(studentData);
      } catch {
        setWarning("اطلاعات پروفایل دانشجو از سرویس احراز هویت دریافت نشد، اما تاریخچه امانت قابل نمایش است.");
        studentData = searchParams.get("username")
          ? { id: studentId, username: searchParams.get("username")!, email: searchParams.get("email") || "", role: "student", is_active: true, student_number: searchParams.get("student_number") ?? undefined }
          : null;
      }

      try {
        const allBorrows = await getBorrows();
        const now = new Date();
        const studentUsername = (studentData?.username || searchParams.get("username") || "").toLowerCase();
        const studentBorrows = allBorrows.filter(
          (borrow) =>
            String(borrow.borrower_id) === String(studentId) ||
            (studentUsername && String(borrow.borrower_username || "").toLowerCase() === studentUsername)
        );
        const mappedRows = studentBorrows.map((borrow) => {
          const borrowedAt = new Date(borrow.borrowed_date);
          const dueDate = new Date(borrowedAt.getTime() + BORROW_DAYS * DAY_MS);
          const resolvedDate = borrow.return_date ? new Date(borrow.return_date) : now;
          const overdueDays = Math.max(0, Math.floor((resolvedDate.getTime() - dueDate.getTime()) / DAY_MS));
          const isReturned = Boolean(borrow.return_date);
          const status: StudentBorrowRow["status"] = isReturned ? "returned" : overdueDays > 0 ? "overdue" : "active";

          return {
            id: borrow.id,
            shelf_book: borrow.shelf_book,
            borrowed_date: borrow.borrowed_date,
            due_date: dueDate.toISOString(),
            return_date: borrow.return_date,
            status,
            overdue_days: overdueDays,
            penalty: overdueDays * PENALTY_PER_DAY,
          };
        });

        mappedRows.sort((a, b) => b.id - a.id);
        setRows(mappedRows);
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : "خطا در بارگذاری اطلاعات دانشجو";
        setError(`خطا در دریافت تاریخچه امانت: ${message}`);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId, searchParams]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === "active").length;
    const overdue = rows.filter((row) => row.status === "overdue").length;
    const totalPenalty = rows.reduce((sum, row) => sum + row.penalty, 0);
    return { total, active, overdue, totalPenalty };
  }, [rows]);

  const columns: Column<StudentBorrowRow>[] = [
    { key: "id", header: "#", render: (row) => row.id, className: "w-12" },
    { key: "shelf_book", header: "قفسه-کتاب", render: (row) => row.shelf_book },
    { key: "borrowed_date", header: "تاریخ امانت", render: (row) => toDateLabel(row.borrowed_date) },
    { key: "due_date", header: "تاریخ سررسید", render: (row) => toDateLabel(row.due_date) },
    { key: "return_date", header: "تاریخ بازگشت", render: (row) => toDateLabel(row.return_date) },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => {
        if (row.status === "returned") return <StatusBadge label="بازگردانده شده" variant="success" />;
        if (row.status === "overdue") return <StatusBadge label="معوقه" variant="danger" />;
        return <StatusBadge label="فعال" variant="info" />;
      },
    },
    { key: "overdue_days", header: "روز تاخیر", render: (row) => row.overdue_days || "—" },
    { key: "penalty", header: "جریمه", render: (row) => row.penalty > 0 ? toMoney(row.penalty) : "—" },
  ];

  const handleEditSave = async (payload: { username: string; email: string; student_number?: string }) => {
    setSavingEdit(true);
    setActionError("");
    try {
      const updated = await updateUser(studentId, payload);
      setStudent(updated);
      setEditOpen(false);
    } catch (saveError: unknown) {
      setActionError(saveError instanceof Error ? saveError.message : "خطا در ویرایش دانشجو");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteStudent = async () => {
    setDeleting(true);
    setActionError("");
    try {
      await deleteUser(studentId);
      router.push("/librarian-dashboard/students");
    } catch (deleteError: unknown) {
      setActionError(deleteError instanceof Error ? deleteError.message : "خطا در حذف دانشجو");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="پرونده دانشجو"
        description={student ? `اطلاعات امانت‌ها و جریمه‌های ${student.username}` : "مشاهده تاریخچه امانت و جریمه‌ها"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg"
            >
              ویرایش دانشجو
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              حذف دانشجو
            </button>
            <Link href="/librarian-dashboard/students" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              بازگشت به مدیریت دانشجویان
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {warning && !error && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          {warning}
        </div>
      )}
      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">کل امانت‌ها</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">امانت‌های فعال</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">امانت‌های معوقه</p>
          <p className="text-xl font-semibold text-red-600 mt-1">{stats.overdue}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
          <p className="text-xs text-gray-500">مجموع جریمه</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{toMoney(stats.totalPenalty)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">اطلاعات دانشجو</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm text-gray-700">
          <div>شناسه: <span className="font-medium">{student?.id ?? "—"}</span></div>
          <div>نام کاربری: <span className="font-medium">{student?.username ?? "—"}</span></div>
          <div>شماره دانشجویی: <span className="font-medium">{student?.student_number || "—"}</span></div>
          <div>ایمیل: <span className="font-medium">{student?.email || "—"}</span></div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        keyExtractor={(row) => row.id}
        emptyTitle="تاریخچه امانتی یافت نشد"
        emptyDescription="این دانشجو هنوز امانتی ثبت‌شده‌ای ندارد."
      />
      <EditStudentModal
        open={editOpen}
        user={student}
        saving={savingEdit}
        error={actionError}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="حذف دانشجو"
        message="آیا مطمئن هستید که می‌خواهید این دانشجو را حذف کنید؟"
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export default function StudentDetailsPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <StudentDetailsContent />
    </DashboardLayout>
  );
}
