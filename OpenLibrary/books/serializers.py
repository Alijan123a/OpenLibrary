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
    shelf_location = serializers.CharField(source='shelf_book.shelf.location', read_only=True)
    book_title = serializers.CharField(source='shelf_book.book.title', read_only=True)
    book_author = serializers.CharField(source='shelf_book.book.author', read_only=True)

    class Meta:
        model = Borrow
        fields = [
            'id', 'shelf_book', 'shelf_location', 'book_title', 'book_author',
            'borrowed_date', 'return_date', 'borrower_id', 'borrower_username', 'borrower_role',
        ]

