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
    throw new Error(err.detail || `Failed to assign book to shelf: ${res.status}`);
  }
  return res.json();
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
    throw new Error(err.detail || `Failed to update shelf-book: ${res.status}`);
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
