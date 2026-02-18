"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getRoleFromToken } from "@/lib/role";
import type { UserRole } from "@/lib/role";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();

  const auth = useMemo(() => {
    const token = getAuthToken();
    if (!token) return null;
    const role = getRoleFromToken(token);
    if (!role) return null;
    return { role };
  }, []);

  useEffect(() => {
    if (!auth) {
      router.push("/login");
      return;
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
      router.push("/unauthorized");
    }
  }, [auth, allowedRoles, router]);

  if (!auth) return null;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) return null;

  return <>{children}</>;
}
