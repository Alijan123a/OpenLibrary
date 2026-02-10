"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/auth";

interface Book {
  id: number;
  title: string;
  author: string;
  // add any other fields you need
}

export default function BooksList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function loadBooks() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiBase}/api/books/`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || res.statusText || "Error fetching books");
        }
        const data = await res.json();
        // Extract the "results" array from the paginated response
        setBooks(data.results);
      } catch (err: any) {
        console.error("Fetch Books Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  if (loading) return <p>Loading books...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Library Books</h1>
      {books.length === 0 ? (
        <p>No books found.</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <strong>{book.title}</strong> by {book.author}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}