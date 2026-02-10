from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from .filters import BookFilter
from .models import Book, Shelf, ShelfBook, Borrow
from .serializers import (
    BookSerializer,
    BorrowSerializer,
    ShelfBookSerializer,
    ShelfSerializer,
)
from .permissions import IsAdminOrLibrarian, IsStudent


# User/Admin/Librarian/Member management lives in OpenLibraryAuthService; this backend only verifies JWT and uses identity for permissions.


# Admins and Library employees can manage books
class BookViewSet(viewsets.ModelViewSet):
    """
        API endpoint that allows books to be viewed or edited.
    """
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    # permission_classes = [IsAuthenticated]  # Require authentication
    permission_classes = [IsAuthenticated, IsAdminOrLibrarian, ]  # Require authentication, Apply permission

    # Configure the filter backends to enable advanced filtering, search, and ordering.
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Attach the custom FilterSet for advanced filtering.
    filterset_class = BookFilter

    # Enable search across text fields.
    search_fields = ['title', 'description']

    # Allow ordering of the results.
    ordering_fields = ['publication_date', 'price']


# Admins and Library employees can manage shelfs
class ShelfViewSet(viewsets.ModelViewSet):
    queryset = Shelf.objects.all()
    serializer_class = ShelfSerializer
    permission_classes = [IsAuthenticated, IsAdminOrLibrarian, ]  # Require authentication, Apply permission


# Admins and Library employees can manage shelf-books
class ShelfBookViewSet(viewsets.ModelViewSet):
    queryset = ShelfBook.objects.all()
    serializer_class = ShelfBookSerializer
    permission_classes = [IsAuthenticated, IsAdminOrLibrarian, ]  # Require authentication, Apply permission


# Students can borrow books but not manage them
class BorrowViewSet(viewsets.ModelViewSet):
    queryset = Borrow.objects.all()
    serializer_class = BorrowSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    
    def perform_create(self, serializer):
        """
        Capture identity from JWT (verified by Auth Service) and store in Borrow.
        """
        user = getattr(self.request, "user", None)
        borrower_kwargs = {}
        if user is not None:
            borrower_kwargs = {
                "borrower_id": getattr(user, "id", None),
                "borrower_username": getattr(user, "username", None),
                "borrower_role": getattr(user, "role", None),
            }
        serializer.save(**borrower_kwargs)


