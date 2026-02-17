"use client";

import { getAuthToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Shelf {
  id: number;
  location: string;
  capacity: number;
}

export interface ShelfBook {
  id: number;
  shelf: number;
  book: number;
  copies_in_shelf: number;
}

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

/** Fetch all shelves. (Handles paginated response from Django REST Framework) */
export async function getShelves(): Promise<Shelf[]> {
  const res = await fetch(`${API_BASE_URL}/api/shelves/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch shelves: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
}

/** Create a shelf. */
export async function createShelf(data: { location: string; capacity: number }): Promise<Shelf> {
  const res = await fetch(`${API_BASE_URL}/api/shelves/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create shelf: ${res.status}`);
  return res.json();
}

/** Update a shelf. */
export async function updateShelf(id: number, data: Partial<{ location: string; capacity: number }>): Promise<Shelf> {
  const res = await fetch(`${API_BASE_URL}/api/shelves/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update shelf: ${res.status}`);
  return res.json();
}

/** Delete a shelf. */
export async function deleteShelf(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/shelves/${id}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete shelf: ${res.status}`);
}

/** Fetch all shelf-book assignments. (Handles paginated response from Django REST Framework) */
export async function getShelfBooks(): Promise<ShelfBook[]> {
  const res = await fetch(`${API_BASE_URL}/api/shelf-books/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch shelf-books: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
}

/** Assign a book to a shelf. */
export async function assignBookToShelf(data: { shelf: number; book: number; copies_in_shelf: number }): Promise<ShelfBook> {
  const res = await fetch(`${API_BASE_URL}/api/shelf-books/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msgStr = extractApiErrorMessage(err);
    if (res.status === 403 && (msgStr?.toLowerCase().includes("authentication") || msgStr?.toLowerCase().includes("credential"))) {
      throw new Error("احراز هویت ناموفق بود. لطفاً دوباره وارد شوید.");
    }
    throw new Error(msgStr || `Failed to assign book to shelf: ${res.status}`);
  }
  return res.json();
}

function extractApiErrorMessage(err: Record<string, unknown>): string | null {
  const d = err.detail;
  if (typeof d === "string" && d) return d;
  if (Array.isArray(d) && d.length > 0) return String(d[0]);
  const nfe = err.non_field_errors;
  if (Array.isArray(nfe) && nfe.length > 0) return String(nfe[0]);
  if (typeof err.message === "string" && err.message) return err.message;
  if (typeof d === "object" && d !== null) {
    const first = Object.values(d)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
    if (typeof first === "string") return first;
  }
  return null;
}

/** Update copies_in_shelf for an existing shelf-book assignment. */
export async function updateShelfBook(id: number, data: { copies_in_shelf: number }): Promise<ShelfBook> {
  const res = await fetch(`${API_BASE_URL}/api/shelf-books/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msgStr = extractApiErrorMessage(err);
    throw new Error(msgStr || `Failed to update shelf-book: ${res.status}`);
  }
  return res.json();
}

/** Remove a shelf-book assignment. */
export async function deleteShelfBook(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/shelf-books/${id}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to delete shelf-book: ${res.status}`);
  }
}
