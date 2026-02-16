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

/** Fetch users from Auth Service. Admin sees all; librarian sees only students. */
export async function getUsers(role?: "admin" | "librarian" | "student"): Promise<User[]> {
  const url = role ? `${AUTH_BASE_URL}/api/users/?role=${role}` : `${AUTH_BASE_URL}/api/users/`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to fetch users: ${res.status}`);
  }
  return res.json();
}

/** Fetch one user by id from Auth Service. */
export async function getUserById(id: number): Promise<User> {
  const res = await fetch(`${AUTH_BASE_URL}/api/users/${id}/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to fetch user: ${res.status}`);
  }
  return res.json();
}

/** Create a user via Auth Service. */
export async function createUser(data: { username: string; password: string; email: string; role: string }): Promise<User> {
  const res = await fetch(`${AUTH_BASE_URL}/api/users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.username?.[0] || data.password?.[0] || data.detail || `Failed to create user: ${res.status}`);
  }
  return res.json();
}

/** Update a user. */
export async function updateUser(id: number, data: Partial<{ username: string; email: string; role: string; is_active: boolean }>): Promise<User> {
  const res = await fetch(`${AUTH_BASE_URL}/api/users/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.username?.[0] || data.detail || `Failed to update user: ${res.status}`);
  }
  return res.json();
}

/** Delete a user. */
export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${AUTH_BASE_URL}/api/users/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to delete user: ${res.status}`);
  }
}
