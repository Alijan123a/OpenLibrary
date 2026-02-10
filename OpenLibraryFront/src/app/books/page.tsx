import ProtectedRoute from "@/components/ProtectedRoute";
import BooksList from "@/components/BooksList";

export default function BooksPage() {
  return (
    <ProtectedRoute>
      <BooksList />
    </ProtectedRoute>
  );
}