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

