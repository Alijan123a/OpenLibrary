"use client";

import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default function Navbar() {
  const pathname = usePathname();
  const showNavbar = pathname !== "/login";

  if (!showNavbar) return null;

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        <h1 className="text-lg font-bold">📚 My Library App</h1>
        <nav className="space-x-4">
          <a href="/" className="hover:underline">Home</a>
          <a href="/books" className="hover:underline">Books</a>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
