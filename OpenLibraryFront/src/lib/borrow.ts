"use client";

import { getAuthToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Borrow {
  id: number;
  shelf_book: number;
  borrowed_date: string;
  return_date: string | null;
  borrower_id: string | null;
  borrower_username: string | null;
  borrower_role: string | null;
}

/** Fetch all borrows (student sees their own, librarian sees all). (Handles paginated response from Django REST Framework) */
export async function getBorrows(): Promise<Borrow[]> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/borrow/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch borrows: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
}

/** Create a new borrow record. */
export async function createBorrow(shelfBookId: number): Promise<Borrow> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/borrow/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shelf_book: shelfBookId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to create borrow: ${res.status}`);
  }
  return res.json();
}

/** Return a borrowed book by updating its record. */
export async function returnBook(borrowId: number): Promise<Borrow> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/borrow/${borrowId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ return_date: new Date().toISOString() }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to return book: ${res.status}`);
  }
  return res.json();
}
