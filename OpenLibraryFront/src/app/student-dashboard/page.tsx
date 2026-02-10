"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkRole } from "@/lib/role"; // import the function we wrote earlier
 
export default function StudentDashboard() { 
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

      if (userRole !== "student") {
        router.push("/unauthorized");
        return;
      }

      setRole(userRole);
      setLoading(false);
    }

    verifyRole();
  }, [router]);

  if (loading) return <p>در حال بارگذاری داشبورد...</p>;

  return (
    <div>
      <h1>📚 داشبورد دانشجو</h1>
    </div>
  );
}