"use client";

export type UserRole = "admin" | "librarian" | "student" | "unknown";

/**
 * Read role directly from JWT payload (no API call).
 * The JWT already contains role, username, user_id from Auth Service.
 * Returns null if token is missing, malformed, or expired.
 */
export function getRoleFromToken(token: string): UserRole | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null; // expired
    }
    const role = (payload.role || "unknown") as string;
    if (["admin", "librarian", "student"].includes(role)) return role as UserRole;
    return "unknown";
  } catch {
    return null;
  }
}

/**
 * Get username from JWT payload.
 */
export function getUsernameFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || "";
  } catch {
    return "";
  }
}

/**
 * Verify role via Auth Service API (network call).
 * Only needed for critical operations or when JWT might be revoked.
 */
export async function checkRole(token: string): Promise<UserRole | null> {
  const url = process.env.NEXT_PUBLIC_CHECK_ROLE;
  if (!url) {
    return null;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data: { role?: UserRole } = await res.json();
    return (data.role ?? "unknown") as UserRole;
  } catch {
    return null;
  }
}
