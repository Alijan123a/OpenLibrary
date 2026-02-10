from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter

from .views import (
    BookViewSet, ShelfViewSet, ShelfBookViewSet, BorrowViewSet, AudioBookUploadViewSet,
)


router = DefaultRouter()

# Register viewsets with corresponding route names
# User and role management endpoints removed to keep this service auth-agnostic.
# Router registrations for users, librarians, members, and admins are intentionally omitted.
router.register(r'books', BookViewSet)
router.register(r'shelves', ShelfViewSet)
router.register(r'shelf-books', ShelfBookViewSet)
router.register(r'borrow', BorrowViewSet)
router.register(r'audio-uploads', AudioBookUploadViewSet)



# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    # All API endpoints registered with the router are now under /api/
    path('api/', include(router.urls)),
]

