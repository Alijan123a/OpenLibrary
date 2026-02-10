"use client";

export type UserRole = "admin" | "librarian" | "student" | "unknown";

export async function checkRole(token: string): Promise<UserRole | null> {
  const url = process.env.NEXT_PUBLIC_CHECK_ROLE;
  if (!url) {
    console.error("NEXT_PUBLIC_CHECK_ROLE is not defined");
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
      // 401/403 means token invalid/expired, or not authorized
      console.error("Failed to fetch user role:", res.status, res.statusText);
      return null;
    }

    const data: { role?: UserRole } = await res.json();
    return (data.role ?? "unknown") as UserRole;
  } catch (err) {
    console.error("Error calling /api/user-role/:", err);
    return null;
  }
}