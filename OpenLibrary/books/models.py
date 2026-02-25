import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.utils.timezone import override, now


class CustomUser(AbstractUser):
    """
    Custom user model restricting users to only one group.
    """

    # def save(self, *args, **kwargs):
    # Ensure the user belongs to only one group
    # if self.groups.count() > 1:
    #     raise ValueError(f"User '{self.username}' cannot belong to multiple groups.")
    # super().save(*args, **kwargs)

    # Common User data fields
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    # ROLE_CHOICES = [
    #     ('admin', 'System Admin'),
    #     ('employee', 'Library Employee'),
    #     ('student', 'Student'),
    # ]
    # role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.username}"


class AdminProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="admin")
    permissions = models.JSONField(null=True, blank=True)  # Store permission levels dynamically

    # managed_libraries = models.ManyToManyField('LibraryBranch')  # Example admin control

    def __str__(self):
        return f"{self.user.username}"


class LibrarianProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="employee")
    employee_id = models.CharField(max_length=10, unique=False, null=True)
    department = models.CharField(max_length=100, unique=False, null=True)

    # assigned_sections = models.ManyToManyField('LibrarySection')  # Example relationship

    def __str__(self):
        return f"{self.user.username}"


class MemberProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="student")
    membership_id = models.CharField(max_length=10, unique=True, help_text='Set this field to student ID')
    # borrowed_books = models.ManyToManyField('Book', blank=True)
    fines_due = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)

    @property
    def borrowed_books(self):
        """
        Returns a queryset of Book instances that this member
        currently has borrowed.
        Only includes loans that are still active (i.e. return_date is null).
        """
        from django.db.models import Q
        # This query works by following the chain from Borrow to ShelfBook to Book.
        return Book.objects.filter(
            shelfbook__borrow__student=self,
            shelfbook__borrow__return_date__isnull=True
        ).distinct()

    def __str__(self):
        return f"{self.user.username}"


# ------------------------
class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    published_date = models.DateField(null=True, blank=True)
    isbn = models.CharField(max_length=13, unique=True)
    qr_code_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        null=False,
        verbose_name="QR Code ID",
        help_text="Unique ID for QR codes. QR image generation and decoding are handled by OpenLibraryQRService.",
    )

    description = models.TextField(null=True, blank=True, help_text="Brief summary or synopsis of the book.")
    publisher = models.CharField(max_length=255, null=True, blank=True)
    language = models.CharField(max_length=50, default="Persian")
    cover_image = models.ImageField(upload_to="book_covers/", null=True, blank=True)

    total_copies = models.PositiveIntegerField(default=1, help_text="Total copies in all shelves + warehouse")
    # available_copies = models.PositiveIntegerField(default=1,
    #                                                help_text="Copies that are currently available for borrowing")

    # Price field added to hold the price in Iranian Rials.
    price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        null=True,
        blank=True,
        help_text="Price of the book in Iranian Rials"
    )

    created_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Library Book"
        verbose_name_plural = "Library Books"


class Shelf(models.Model):
    location = models.CharField(max_length=255)  # Physical location identifier
    capacity = models.PositiveIntegerField(default=50)  # Total capacity of the shelf
    books = models.ManyToManyField(Book, through='ShelfBook')  # Many-to-many relationship

    def __str__(self):
        return f"Shelf {self.id} - {self.location}"


class ShelfBook(models.Model):
    shelf = models.ForeignKey(Shelf, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    copies_in_shelf = models.PositiveIntegerField(default=1)  # Copies in a specific shelf

    def borrow_book(self):
        """Decrease available copies when a student borrows a book."""
        if self.copies_in_shelf > 0:
            self.copies_in_shelf -= 1
            self.save()
        else:
            raise ValueError("No copies left.")

    def return_book(self):
        """Increase available copies when a student returns a book."""
        # if self.book.available_copies < self.book.total_copies:
        self.copies_in_shelf += 1
        self.save()

    def clean(self):
        """
        Validate that adding these copies does not exceed the shelf's capacity,
        and that total allocated for the book does not exceed book.total_copies.
        """
        from django.core.exceptions import ValidationError

        # Shelf capacity check
        qs = ShelfBook.objects.filter(shelf=self.shelf)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        total_existing = qs.aggregate(total=models.Sum('copies_in_shelf'))['total'] or 0
        new_total = total_existing + self.copies_in_shelf
        if new_total > self.shelf.capacity:
            raise ValidationError(
                f"Cannot add {self.copies_in_shelf} copies: shelf capacity ({self.shelf.capacity}) "
                f"would be exceeded. Currently, there are {total_existing} copies on the shelf."
            )

        # Book total copies check: allocated must not exceed book.total_copies
        other_shelf_books = ShelfBook.objects.filter(book=self.book)
        if self.pk:
            other_shelf_books = other_shelf_books.exclude(pk=self.pk)
        other_total = other_shelf_books.aggregate(total=models.Sum('copies_in_shelf'))['total'] or 0
        allocated_total = other_total + self.copies_in_shelf
        if allocated_total > self.book.total_copies:
            raise ValidationError(
                f"تخصیص کل ({allocated_total}) از تعداد کل کتاب ({self.book.total_copies}) بیشتر نمی‌تواند باشد."
            )

    def save(self, *args, **kwargs):
        # Ensure our clean() validations are run before saving
        self.clean()
        super().save(*args, **kwargs)


class Borrow(models.Model):
    """Identity comes from JWT (Auth Service); stored in borrower_id/username/role."""
    shelf_book = models.ForeignKey(ShelfBook, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    book = models.ForeignKey(Book, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    borrowed_date = models.DateTimeField(auto_now_add=True)
    return_date = models.DateTimeField(null=True, blank=True)  # Nullable for ongoing loans

    # New header-based identity (from API Gateway / Auth service)
    borrower_id = models.CharField(max_length=64, null=True, blank=True, help_text="External user ID from Auth service")
    borrower_username = models.CharField(max_length=150, null=True, blank=True)
    borrower_role = models.CharField(max_length=50, null=True, blank=True)
    borrower_student_number = models.CharField(max_length=20, null=True, blank=True, verbose_name="شماره دانشجویی")

    def save(self, *args, **kwargs):
        is_create = self.pk is None
        if is_create:
            if not self.shelf_book_id:
                raise ValueError("shelf_book is required for new borrow.")
            # copies_in_shelf = total in shelf; available = copies_in_shelf - active_borrows (do NOT decrement on borrow)
            active = Borrow.objects.filter(shelf_book=self.shelf_book, return_date__isnull=True).count()
            if self.shelf_book.copies_in_shelf <= active:
                raise ValueError("No copies available.")
            if not self.book_id:
                self.book = self.shelf_book.book
        super().save(*args, **kwargs)

    def return_book(self):
        """Return to same shelf: only set return_date, copies_in_shelf unchanged."""
        if not self.shelf_book_id:
            raise ValueError("Cannot return to original shelf: shelf was removed. Use return to different shelf.")
        self.return_date = now()
        self.save(update_fields=["return_date"])

    def return_book_to_shelf(self, shelf):
        """Return to specified shelf. Same shelf: only set return_date. Different shelf: move copy."""
        book = (self.book or (self.shelf_book.book if self.shelf_book_id else None))
        if not book:
            raise ValueError("Cannot return: book reference is missing.")
        original_shelf_book = self.shelf_book
        if original_shelf_book and original_shelf_book.shelf_id == shelf.id:
            # Same shelf: only set return_date
            self.return_date = now()
            self.save(update_fields=["return_date"])
            return
        # Different shelf: decrement original, add to target (total allocated unchanged)
        shelf_book, _ = ShelfBook.objects.get_or_create(
            shelf=shelf,
            book=book,
            defaults={"copies_in_shelf": 0},
        )
        shelf_book.copies_in_shelf += 1
        shelf_book.save()
        if original_shelf_book:
            original_shelf_book.copies_in_shelf -= 1
            original_shelf_book.save()
            if original_shelf_book.copies_in_shelf == 0:
                original_shelf_book.delete()
                self.shelf_book_id = None  # clear FK before save (object was deleted)
        self.return_date = now()
        self.save(update_fields=["return_date", "shelf_book"] if self.shelf_book_id is None else ["return_date"])


class AudioBookUpload(models.Model):
    """Student audio book uploads. Identity from JWT (Auth Service)."""
    borrower_id = models.CharField(max_length=64, null=True, blank=True)
    borrower_username = models.CharField(max_length=150, null=True, blank=True)
    file = models.FileField(upload_to="audio_books/%Y/%m/")
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title or self.file.name} ({self.borrower_username})"