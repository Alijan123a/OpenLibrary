from django.core.exceptions import ValidationError as DjangoValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError as DRFValidationError

from .filters import BookFilter
from .models import Book, Shelf, ShelfBook, Borrow, AudioBookUpload
from .serializers import (
    BookSerializer,
    BorrowSerializer,
    ShelfBookSerializer,
    ShelfSerializer,
    AudioBookUploadSerializer,
)
from .permissions import IsAdminOrLibrarian, IsStudent, BorrowListCreatePermission, BorrowObjectPermission


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
    ordering_fields = ['published_date', 'price']


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

    def _handle_validation_error(self, exc):
        """Convert Django ValidationError to DRF ValidationError for proper 400 response."""
        if hasattr(exc, "message_dict") and exc.message_dict:
            raise DRFValidationError(exc.message_dict)
        if hasattr(exc, "messages") and exc.messages:
            msg = exc.messages[0] if len(exc.messages) == 1 else "; ".join(str(m) for m in exc.messages)
            raise DRFValidationError(msg)
        raise DRFValidationError(str(exc))

    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            self._handle_validation_error(e)

    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            self._handle_validation_error(e)


# Students can create borrows; librarians/admins can list all; students see only their own.
class BorrowViewSet(viewsets.ModelViewSet):
    queryset = Borrow.objects.all()
    serializer_class = BorrowSerializer
    permission_classes = [IsAuthenticated, BorrowListCreatePermission, BorrowObjectPermission]

    def get_queryset(self):
        """Students see only their own borrows; librarians/admins see all."""
        qs = Borrow.objects.all()
        role = getattr(getattr(self.request, "user", None), "role", None)
        if role and str(role).strip().lower() == "student":
            user_id = str(getattr(self.request.user, "id", ""))
            qs = qs.filter(borrower_id=user_id)
        return qs

    def perform_create(self, serializer):
        """Capture identity from JWT (verified by Auth Service) and store in Borrow."""
        user = getattr(self.request, "user", None)
        borrower_kwargs = {}
        if user is not None:
            borrower_kwargs = {
                "borrower_id": getattr(user, "id", None),
                "borrower_username": getattr(user, "username", None),
                "borrower_role": getattr(user, "role", None),
            }
        serializer.save(**borrower_kwargs)

    def perform_update(self, serializer):
        """When return_date is set, call model's return_book() to update shelf copies."""
        instance = serializer.instance
        return_date = serializer.validated_data.get("return_date")
        if return_date is not None and instance.return_date is None:
            instance.return_book()
        else:
            serializer.save()


class AudioBookUploadViewSet(viewsets.ModelViewSet):
    """Students can upload audio book files."""
    queryset = AudioBookUpload.objects.all()
    serializer_class = AudioBookUploadSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        """Students see only their own uploads."""
        user_id = str(getattr(self.request.user, "id", ""))
        return AudioBookUpload.objects.filter(borrower_id=user_id)

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            borrower_id=getattr(user, "id", None),
            borrower_username=getattr(user, "username", None),
        )


