from django.test import TestCase
from .models import Book


# Create your tests here.
class BookTestCase(TestCase):
    def test_create_book(self):
        book = Book.objects.create(title="Django Essentials", author="John Doe")
        self.assertEqual(book.title, "Django Essentials")

