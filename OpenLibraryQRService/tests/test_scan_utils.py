import sys
import os

# Ensure the service module is importable when running tests from the project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import _find_book_by_qr


def test_find_book_by_qr_found():
    books = [
        {"id": 1, "title": "A", "qr_code_id": "1111-2222"},
        {"id": 2, "title": "B", "qr_code_id": "3333-4444"},
    ]
    found = _find_book_by_qr(books, "3333-4444")
    assert found is not None
    assert found["id"] == 2


def test_find_book_by_qr_not_found():
    books = [{"id": 1, "title": "A", "qr_code_id": "1111-2222"}]
    found = _find_book_by_qr(books, "no-match")
    assert found is None
