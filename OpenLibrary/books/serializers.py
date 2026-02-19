from rest_framework import serializers
from .models import Book, Shelf, ShelfBook, Borrow, AudioBookUpload


# User/Admin/Librarian/Member serializers removed; identity is managed by OpenLibraryAuthService and passed via JWT.


class AudioBookUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioBookUpload
        fields = ['id', 'file', 'title', 'created_at', 'borrower_username']


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

class ShelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelf
        fields = '__all__'

class ShelfBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShelfBook
        fields = '__all__'

class BorrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Borrow
        fields = '__all__'


class BorrowListSerializer(serializers.ModelSerializer):
    """Borrow with shelf location and book title/author for display."""
    shelf_location = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()
    book_author = serializers.SerializerMethodField()

    class Meta:
        model = Borrow
        fields = [
            'id', 'shelf_book', 'shelf_location', 'book_title', 'book_author',
            'borrowed_date', 'return_date', 'borrower_id', 'borrower_username', 'borrower_role',
            'borrower_student_number',
        ]

    def get_shelf_location(self, obj):
        if obj.shelf_book:
            return obj.shelf_book.shelf.location
        return "—"

    def get_book_title(self, obj):
        book = obj.book or (obj.shelf_book.book if obj.shelf_book else None)
        return book.title if book else "—"

    def get_book_author(self, obj):
        book = obj.book or (obj.shelf_book.book if obj.shelf_book else None)
        return book.author if book else "—"

