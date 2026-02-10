"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import CreateBookModal from "@/components/CreateBookModal";
import { getQrImageUrl } from "@/lib/qr";
import { FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import { booksApi } from "@/lib/books";

// Update Book interface to match API response
interface ApiBook {
  id: number;
  title: string;
  author: string;
  published_date: string | null;
  isbn: string;
  qr_code_id: string;
  description: string;
  publisher: string;
  language: string;
  cover_image: string | null;
  total_copies: number;
  price: number | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiBook[];
}

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const savedToken = localStorage.getItem("jwt");
    setToken(savedToken);
  }, []);

  const fetchBooks = async () => {
    if (!token) return; // Don't fetch if no token

    try {
      setLoading(true);
      setError(null);
      const response = await booksApi.getBooks();

      // Handle direct array response or paginated response structure
      if (Array.isArray(response)) {
        // Direct array response
        setBooks(response as ApiBook[]);
        setTotalCount(response.length);
      } else if (response && (response as ApiResponse).results && Array.isArray((response as ApiResponse).results)) {
        // Paginated response
        const paginatedResponse = response as ApiResponse;
        setBooks(paginatedResponse.results);
        setTotalCount(paginatedResponse.count);
      } else {
        setBooks([]);
        setTotalCount(0);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("خطا در دریافت کتاب‌ها:", error);
      setError("خطا در دریافت کتاب‌ها");
      setBooks([]); // Ensure books remains an array even on error
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBooks();
    }
  }, [token]); // Fetch books when token is available

  const handleCreateBook = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditBook = (bookId: number) => {
    // TODO: Implement edit book functionality
    console.log("ویرایش کتاب:", bookId);
  };

  const handleDeleteBook = (bookId: number) => {
    // TODO: Implement delete book functionality
    if (confirm("آیا از حذف این کتاب اطمینان دارید؟")) {
      setBooks((prev) => prev.filter((book) => book.id !== bookId));
      console.log("حذف کتاب:", bookId);
    }
  };

  const handleAddBookSuccess = () => {
    // Refresh the books list after successful creation
    fetchBooks();
  };

  // Ensure books is always an array before filtering
  const filteredBooks = Array.isArray(books)
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <AdminLayout active="books">
      <div className="space-y-6">
        {/* Header with title and create button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">صفحه کتاب‌ها</h1>
          <button
            onClick={handleCreateBook}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            ایجاد کتاب
          </button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="جستجو"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded">
            <FaSearch size={16} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Books table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-600 text-sm">
            <div className="col-span-1">QR</div>
            <div className="col-span-3">اسم کتاب</div>
            <div className="col-span-2">اسم نویسنده</div>
            <div className="col-span-2">شابک(ISBN)</div>
            <div className="col-span-2">تعداد</div>
            <div className="col-span-2">عملیات</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                در حال بارگذاری...
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? "کتابی با این مشخصات یافت نشد" : "هیچ کتابی موجود نیست"}
              </div>
            ) : (
              filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* QR code from QR Service */}
                  <div className="col-span-1 flex items-center">
                    {book.qr_code_id ? (
                      <img
                        src={getQrImageUrl(book.qr_code_id)}
                        alt={`QR ${book.title}`}
                        className="w-10 h-10 object-contain border rounded"
                        title={book.qr_code_id}
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </div>
                  {/* Book name with cover image */}
                  <div className="col-span-3 flex items-center gap-3">
                    <img
                      src={book.cover_image || "/api/placeholder/60/80"}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded border"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800">{book.title}</h3>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-gray-700">{book.author}</span>
                  </div>

                  {/* ISBN */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-gray-600">{book.isbn}</span>
                  </div>

                  {/* Total copies */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-gray-700">{book.total_copies}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => handleEditBook(book.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="ویرایش کتاب"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="حذف کتاب"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>نمایش</span>
              <select className="border border-gray-300 rounded px-2 py-1">
                <option>6</option>
                <option>12</option>
                <option>24</option>
              </select>
              <span>مورد از {totalCount} کتاب</span>
            </div>
            <div className="flex items-center gap-4">
              <span>صفحه 1 از 1</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
                  ‹‹
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
                  ‹
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
                  ›
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
                  ››
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Book Modal */}
      <CreateBookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAddBookSuccess}
      />
    </AdminLayout>
  );
}
