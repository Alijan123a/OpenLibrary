from django.contrib import admin

from .models import Book, Shelf, ShelfBook, Borrow

# User/Profile management is in Auth Service. Main backend admin only manages library data.
# Django admin login still uses local AUTH_USER_MODEL (CustomUser) for staff access.

admin.site.site_header = "Open Library Administration"
admin.site.site_title = "Open Library Admin Portal"
admin.site.index_title = "Open Library Management Dashboard"


class BookAdmin(admin.ModelAdmin):
    # This uses Python’s list comprehension to pull all field names from the Book model.
    list_display = [field.name for field in Book._meta.fields]


class ShelfAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Shelf._meta.fields]


class ShelfBookAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ShelfBook._meta.fields]


class BorrowAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Borrow._meta.fields]


admin.site.register(Book, BookAdmin)
admin.site.register(Shelf, ShelfAdmin)
admin.site.register(ShelfBook, ShelfBookAdmin)
admin.site.register(Borrow, BorrowAdmin)
