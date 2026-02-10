"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import {
  FaTachometerAlt,
  FaBook,
  FaUsers,
  FaBoxes,
  FaQrcode,
  FaClipboardList,
  FaChartBar,
  FaSignOutAlt,
  FaUpload,
  FaUsersCog,
} from "react-icons/fa";

export type UserRole = "student" | "librarian" | "admin";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { key: "dashboard", label: "داشبورد", href: "/student-dashboard", icon: <FaTachometerAlt size={16} /> },
  { key: "borrowed", label: "کتاب‌های امانی", href: "/student-dashboard/borrowed", icon: <FaBook size={16} /> },
  { key: "scan", label: "اسکن QR", href: "/student-dashboard/scan", icon: <FaQrcode size={16} /> },
  { key: "upload", label: "آپلود کتاب صوتی", href: "/student-dashboard/upload", icon: <FaUpload size={16} /> },
];

const librarianNav: NavItem[] = [
  { key: "dashboard", label: "داشبورد", href: "/librarian-dashboard", icon: <FaTachometerAlt size={16} /> },
  { key: "books", label: "مدیریت کتاب‌ها", href: "/librarian-dashboard/books", icon: <FaBook size={16} /> },
  { key: "students", label: "مدیریت دانشجویان", href: "/librarian-dashboard/students", icon: <FaUsers size={16} /> },
  { key: "shelves", label: "مدیریت قفسه‌ها", href: "/librarian-dashboard/shelves", icon: <FaBoxes size={16} /> },
  { key: "loans", label: "امانت‌های فعال", href: "/librarian-dashboard/loans", icon: <FaClipboardList size={16} /> },
  { key: "reports", label: "گزارش‌ها", href: "/librarian-dashboard/reports", icon: <FaChartBar size={16} /> },
];

const adminNav: NavItem[] = [
  { key: "dashboard", label: "داشبورد", href: "/admin-dashboard", icon: <FaTachometerAlt size={16} /> },
  { key: "librarians", label: "مدیریت کتابداران", href: "/admin-dashboard/librarians", icon: <FaUsersCog size={16} /> },
  { key: "students", label: "مدیریت دانشجویان", href: "/admin-dashboard/students", icon: <FaUsers size={16} /> },
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "student": return studentNav;
    case "librarian": return librarianNav;
    case "admin": return adminNav;
    default: return [];
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "student": return "دانشجو";
    case "librarian": return "کتابدار";
    case "admin": return "مدیر سیستم";
  }
}

interface SidebarProps {
  role: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-56 bg-gray-900 text-gray-300 flex flex-col z-40">
      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-800">
        <h2 className="text-sm font-bold text-white tracking-wide">سامانه کتابخانه</h2>
        <p className="text-xs text-gray-500 mt-0.5">{getRoleLabel(role)}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-gray-800 text-white border-l-2 border-blue-500"
                  : "hover:bg-gray-800/60 hover:text-white"
              }`}
            >
              <span className="opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-800 p-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FaSignOutAlt size={14} />
          <span>خروج</span>
        </button>
      </div>
    </aside>
  );
}
