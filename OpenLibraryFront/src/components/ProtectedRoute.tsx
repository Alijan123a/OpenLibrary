"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, validateRefreshToken } from "@/lib/auth";
import { checkRole } from "@/lib/role";
import type { UserRole } from "@/lib/role";
import LoadingSpinner from "./ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      validateRefreshToken();

      if (allowedRoles && allowedRoles.length > 0) {
        const role = await checkRole(token);
        if (!role || !allowedRoles.includes(role)) {
          router.push("/unauthorized");
          return;
        }
      }

      setAuthorized(true);
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

  if (!authorized) return null;

  return <>{children}</>;
}
