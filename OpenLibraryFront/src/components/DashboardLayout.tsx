"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkRole } from "@/lib/role";
import type { UserRole } from "@/lib/role";
import Sidebar from "./Sidebar";
import type { UserRole as SidebarRole } from "./Sidebar";
import LoadingSpinner from "./ui/LoadingSpinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      const token = localStorage.getItem("jwt");
      if (!token) {
        router.push("/login");
        return;
      }

      const userRole = await checkRole(token);
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.push("/unauthorized");
        return;
      }

      setRole(userRole);

      // Extract username from JWT payload
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsername(payload.username || "");
      } catch { /* ignore */ }

      setLoading(false);
    }
    verify();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!role) return null;

  const sidebarRole: SidebarRole = role === "admin" ? "admin" : role === "librarian" ? "librarian" : "student";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={sidebarRole} />
      {/* Content area with right margin for sidebar */}
      <div className="mr-56">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-left">
              <span className="text-sm font-medium text-gray-800">{username}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {username ? username[0].toUpperCase() : "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
