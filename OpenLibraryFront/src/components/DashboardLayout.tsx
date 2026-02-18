"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleFromToken, getUsernameFromToken } from "@/lib/role";
import type { UserRole } from "@/lib/role";
import Sidebar, { MobileMenuButton } from "./Sidebar";
import type { UserRole as SidebarRole } from "./Sidebar";
import LoadingSpinner from "./ui/LoadingSpinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [auth, setAuth] = useState<{ role: UserRole; username: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      router.push("/login");
      return;
    }
    const role = getRoleFromToken(token);
    if (!role) {
      router.push("/login");
      return;
    }
    if (!allowedRoles.includes(role)) {
      router.push("/unauthorized");
      return;
    }
    setAuth({ role, username: getUsernameFromToken(token) });
  }, [router, allowedRoles]);

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sidebarRole: SidebarRole = auth.role === "admin" ? "admin" : auth.role === "librarian" ? "librarian" : "student";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={sidebarRole} mobileOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

      <div className="lg:mr-56">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <div className="flex items-center gap-3 ms-auto">
            <span className="text-sm font-medium text-gray-800 hidden sm:inline">{auth.username}</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {auth.username ? auth.username[0].toUpperCase() : "U"}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
