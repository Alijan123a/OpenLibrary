from rest_framework import serializers
from .models import Book, Shelf, ShelfBook, Borrow


# User/Admin/Librarian/Member serializers removed; identity is managed by OpenLibraryAuthService and passed via JWT.



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

