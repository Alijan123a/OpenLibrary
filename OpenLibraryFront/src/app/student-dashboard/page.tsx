"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { getBorrows, type Borrow } from "@/lib/borrow";
import { FaBook, FaExclamationTriangle, FaClock } from "react-icons/fa";

function SummaryCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StudentDashboardContent() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBorrows()
      .then(setBorrows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = borrows.filter((b) => !b.return_date);
  const overdue = active.filter((b) => {
    const borrowed = new Date(b.borrowed_date);
    const dueDate = new Date(borrowed.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    return new Date() > dueDate;
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">داشبورد دانشجو</h1>

      {loading ? (
        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            title="کتاب‌های امانی فعال"
            value={active.length}
            icon={<FaBook size={18} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <SummaryCard
            title="کتاب‌های معوقه"
            value={overdue.length}
            icon={<FaExclamationTriangle size={18} className="text-yellow-600" />}
            color="bg-yellow-50"
          />
          <SummaryCard
            title="کل امانت‌ها"
            value={borrows.length}
            icon={<FaClock size={18} className="text-gray-600" />}
            color="bg-gray-100"
          />
        </div>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["student"]}>
      <StudentDashboardContent />
    </DashboardLayout>
  );
}
