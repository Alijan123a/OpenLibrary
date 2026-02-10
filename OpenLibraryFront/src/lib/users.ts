"use client";

/**
 * Placeholder user management API calls.
 * These would interact with the Auth Service if it exposes user management endpoints.
 * For now, they use the Auth Service's check-role endpoint pattern as a foundation.
 */

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://127.0.0.1:8002";

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

function getToken(): string {
  const token = localStorage.getItem("jwt");
  if (!token) throw new Error("Not authenticated");
  return token;
}

/** Placeholder: Fetch all users. Returns empty array if endpoint is not available. */
export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/users/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/** Placeholder: Create a user via Auth Service. */
export async function createUser(data: { username: string; password: string; email: string; role: string }): Promise<User | null> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Placeholder: Update a user. */
export async function updateUser(id: number, data: Partial<{ username: string; email: string; role: string; is_active: boolean }>): Promise<User | null> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/users/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Placeholder: Delete a user. */
export async function deleteUser(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/users/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
