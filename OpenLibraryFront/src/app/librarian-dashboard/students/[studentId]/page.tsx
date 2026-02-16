"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { getUserById, type User } from "@/lib/users";
import { getBorrows, type Borrow } from "@/lib/borrow";

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

function StudentDetailsContent() {
  const params = useParams<{ studentId: string }>();
  const studentId = Number(params.studentId);

  const [student, setStudent] = useState<User | null>(null);
  const [rows, setRows] = useState<StudentBorrowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId || Number.isNaN(studentId)) {
      setError("شناسه دانشجو معتبر نیست.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [studentData, allBorrows] = await Promise.all([
          getUserById(studentId),
          getBorrows(),
        ]);
        setStudent(studentData);

        const now = new Date();
        const studentBorrows = allBorrows.filter((borrow) => String(borrow.borrower_id) === String(studentData.id));
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
        setError(loadError instanceof Error ? loadError.message : "خطا در بارگذاری اطلاعات دانشجو");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

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

  return (
    <div>
      <PageHeader
        title="پرونده دانشجو"
        description={student ? `اطلاعات امانت‌ها و جریمه‌های ${student.username}` : "مشاهده تاریخچه امانت و جریمه‌ها"}
        action={
          <Link href="/librarian-dashboard/students" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            بازگشت به مدیریت دانشجویان
          </Link>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
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
