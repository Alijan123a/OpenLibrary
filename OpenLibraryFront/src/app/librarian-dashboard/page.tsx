"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkRole } from "@/lib/role"; // import the function we wrote earlier
import AdminLayout from "@/components/AdminLayout";
 
export default function LibrarianDashboard() { 
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function verifyRole() {
      const token = localStorage.getItem("jwt");

      if (!token) {
        router.push("/login");
        return;
      }

      const userRole = await checkRole(token);

      if (userRole !== "librarian") {
        router.push("/unauthorized");
        return;
      }

      setRole(userRole);
      setLoading(false);
    }

    verifyRole();
  }, [router]);

  if (loading) return <p>در حال بارگذاری داشبورد...</p>;
  return(
    <AdminLayout active="dashboard">
      <h1 className="text-2xl font-bold mb-4">صفحه داشبورد</h1>
      <p className="text-gray-600">این صفحه در مرحله آخر تکمیل خواهد شد.</p>
    </AdminLayout>
  )
}