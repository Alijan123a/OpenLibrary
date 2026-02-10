"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateRefreshToken } from "@/lib/auth";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (!token) {
      router.push("/login"); // Redirect to login if token is missing
      return;
    }

    validateRefreshToken();

    const interval = setInterval(validateRefreshToken, 5 * 60 * 1000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return <>{children}</>;
}