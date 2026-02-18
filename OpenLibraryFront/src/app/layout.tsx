import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سامانه مدیریت کتابخانه",
  description: "سامانه مدیریت کتابخانه آنلاین مبتنی بر اسکن QR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
