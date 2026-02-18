"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { booksApi } from "@/lib/books";
import { getBorrows } from "@/lib/borrow";
import { FaBook, FaUsers, FaClipboardList, FaExclamationTriangle } from "react-icons/fa";

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

function LibrarianDashboardContent() {
  const [bookCount, setBookCount] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const books = await booksApi.getBooks();
        setBookCount(books.length);
      } catch { /* ignore */ }

      try {
        const borrows = await getBorrows();
        const active = borrows.filter((b) => !b.return_date);
        setActiveLoans(active.length);

        const overdue = active.filter((b) => {
          const due = new Date(new Date(b.borrowed_date).getTime() + 14 * 24 * 60 * 60 * 1000);
          return new Date() > due;
        });
        setOverdueCount(overdue.length);
      } catch { /* ignore */ }

      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">داشبورد کتابدار</h1>
      {loading ? (
        <LoadingSpinner size="md" className="py-16" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="کل کتاب‌ها"
            value={bookCount}
            icon={<FaBook size={18} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <SummaryCard
            title="امانت‌های فعال"
            value={activeLoans}
            icon={<FaClipboardList size={18} className="text-green-600" />}
            color="bg-green-50"
          />
          <SummaryCard
            title="معوقه‌ها"
            value={overdueCount}
            icon={<FaExclamationTriangle size={18} className="text-yellow-600" />}
            color="bg-yellow-50"
          />
          <SummaryCard
            title="دانشجویان"
            value="—"
            icon={<FaUsers size={18} className="text-gray-600" />}
            color="bg-gray-100"
          />
        </div>
      )}
    </div>
  );
}

export default function LibrarianDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["librarian", "admin"]}>
      <LibrarianDashboardContent />
    </DashboardLayout>
  );
}
