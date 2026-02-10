"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getUsers, type User } from "@/lib/users";
import { FaUsersCog, FaUsers, FaChartBar } from "react-icons/fa";

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

function AdminDashboardContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const librarians = users.filter((u) => u.role === "librarian");
  const students = users.filter((u) => u.role === "student");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">داشبورد مدیر سیستم</h1>
      {loading ? (
        <p className="text-sm text-gray-400">در حال بارگذاری...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            title="کتابداران"
            value={librarians.length}
            icon={<FaUsersCog size={18} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <SummaryCard
            title="دانشجویان"
            value={students.length}
            icon={<FaUsers size={18} className="text-green-600" />}
            color="bg-green-50"
          />
          <SummaryCard
            title="کل کاربران"
            value={users.length}
            icon={<FaChartBar size={18} className="text-gray-600" />}
            color="bg-gray-100"
          />
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </DashboardLayout>
  );
}
