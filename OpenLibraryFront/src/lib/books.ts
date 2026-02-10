import { getAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface CreateBookData {
  title: string;
  author: string;
  publishedDate: string;
  isbn: string;
  description: string;
  publisher: string;
  language: string;
  coverImage: File | null;
  totalCopies: number;
  price: number;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  publishedDate: string;
  isbn: string;
  description: string;
  publisher: string;
  language: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export const booksApi = {
  // Create a new book
  createBook: async (bookData: CreateBookData): Promise<Book> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    
    // Append all text fields
    formData.append('title', bookData.title);
    formData.append('author', bookData.author);
    formData.append('publishedDate', bookData.publishedDate);
    formData.append('isbn', bookData.isbn);
    formData.append('description', bookData.description);
    formData.append('publisher', bookData.publisher);
    formData.append('language', bookData.language);
    formData.append('totalCopies', bookData.totalCopies.toString());
    formData.append('price', bookData.price.toString());
    
    // Append cover image if provided
    if (bookData.coverImage) {
      formData.append('coverImage', bookData.coverImage);
    }

    const response = await fetch(`${API_BASE_URL}/api/books/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get all books
  getBooks: async (): Promise<Book[]> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/books/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Get book by ID
  getBook: async (id: number): Promise<Book> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/books/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Update book
  updateBook: async (id: number, bookData: Partial<CreateBookData>): Promise<Book> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    
    Object.entries(bookData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'coverImage' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'string' || typeof value === 'number') {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/books/${id}/`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Delete book
  deleteBook: async (id: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/books/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};
