"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">دسترسی غیرمجاز</h1>
      <p className="text-gray-600 mb-6">شما به این بخش دسترسی ندارید.</p>
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        بازگشت به ورود
      </Link>d
    </div>
  );
}
