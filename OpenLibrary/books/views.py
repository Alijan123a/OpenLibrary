import requests
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError as DRFValidationError

from .filters import BookFilter
from .models import Book, Shelf, ShelfBook, Borrow, AudioBookUpload
from .serializers import (
    BookSerializer,
    BorrowSerializer,
    BorrowListSerializer,
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

    @action(detail=False, methods=["get"], url_path="by-qr", permission_classes=[IsAuthenticated])
    def book_by_qr(self, request):
        """Get book by QR code ID. Accessible to authenticated users (including students)."""
        qr_code_id = request.query_params.get("qr_code_id")
        if not qr_code_id:
            raise DRFValidationError("qr_code_id is required")
        try:
            book = Book.objects.get(qr_code_id=qr_code_id)
        except Book.DoesNotExist:
            raise DRFValidationError("کتابی با این کد QR یافت نشد.")
        except (ValueError, TypeError):
            raise DRFValidationError("کد QR نامعتبر است.")
        serializer = BookSerializer(book)
        return Response(serializer.data)


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
        qs = Borrow.objects.select_related(
            "shelf_book", "shelf_book__shelf", "shelf_book__book"
        )
        role = getattr(getattr(self.request, "user", None), "role", None)
        if role and str(role).strip().lower() == "student":
            user_id = str(getattr(self.request.user, "id", ""))
            qs = qs.filter(borrower_id=user_id)
        return qs

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return BorrowListSerializer
        return BorrowSerializer

    def _fetch_student_numbers(self, borrower_ids):
        """Fetch student_number from Auth Service for borrows that don't have it."""
        if not borrower_ids:
            return {}
        url = getattr(settings, "AUTH_SERVICE_INTERNAL_URL", "http://127.0.0.1:8002/api/internal/users-info/")
        key = getattr(settings, "AUTH_SERVICE_INTERNAL_KEY", "openlibrary-internal-key")
        ids_str = ",".join(str(x) for x in borrower_ids)
        try:
            resp = requests.get(f"{url}?ids={ids_str}", headers={"X-Internal-Key": key}, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                return {bid: data.get(str(bid), {}).get("student_number", "") or "" for bid in borrower_ids}
        except requests.RequestException:
            pass
        return {}

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        need_enrich = [
            b.borrower_id for b in queryset
            if b.borrower_id and not (b.borrower_student_number or "").strip()
        ]
        enrichment = {}
        if need_enrich:
            enrichment = self._fetch_student_numbers(list(set(need_enrich)))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = list(serializer.data)
            for item in data:
                bid = item.get("borrower_id")
                if bid and not (item.get("borrower_student_number") or "").strip():
                    val = enrichment.get(bid, "")
                    if val:
                        item["borrower_student_number"] = val
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        data = list(serializer.data)
        for item in data:
            bid = item.get("borrower_id")
            if bid and not (item.get("borrower_student_number") or "").strip():
                val = enrichment.get(bid, "")
                if val:
                    item["borrower_student_number"] = val
        return Response(data)

    @action(detail=False, methods=["post"], url_path="by-qr", permission_classes=[IsAuthenticated, IsStudent])
    def borrow_by_qr(self, request):
        """Create a borrow by QR code ID. For students."""
        qr_code_id = request.data.get("qr_code_id")
        if not qr_code_id:
            raise DRFValidationError("qr_code_id is required")

        try:
            book = Book.objects.get(qr_code_id=qr_code_id)
        except Book.DoesNotExist:
            raise DRFValidationError("کتابی با این کد QR یافت نشد.")
        except (ValueError, TypeError):
            raise DRFValidationError("کد QR نامعتبر است.")

        # ShelfBooks for this book with at least one copy
        shelf_books = ShelfBook.objects.filter(book=book, copies_in_shelf__gt=0).annotate(
            active_borrows=Count("borrow", filter=Q(borrow__return_date__isnull=True))
        )
        available = [sb for sb in shelf_books if sb.copies_in_shelf > (sb.active_borrows or 0)]
        if not available:
            raise DRFValidationError("نسخه‌ای از این کتاب در حال حاضر موجود نیست.")

        shelf_book = available[0]
        serializer = BorrowSerializer(data={"shelf_book": shelf_book.id})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        """Capture identity from JWT (verified by Auth Service) and store in Borrow."""
        user = getattr(self.request, "user", None)
        borrower_kwargs = {}
        if user is not None:
            borrower_kwargs = {
                "borrower_id": getattr(user, "id", None),
                "borrower_username": getattr(user, "username", None),
                "borrower_role": getattr(user, "role", None),
                "borrower_student_number": getattr(user, "student_number", None),
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


