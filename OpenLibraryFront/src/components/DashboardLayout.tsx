"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkRole } from "@/lib/role";
import type { UserRole } from "@/lib/role";
import Sidebar, { MobileMenuButton } from "./Sidebar";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <Sidebar role={sidebarRole} mobileOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

      {/* Content area: margin on desktop, full-width on mobile */}
      <div className="lg:mr-56">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-800 hidden sm:inline">{username}</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {username ? username[0].toUpperCase() : "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
