import django_filters
from .models import Book


class BookFilter(django_filters.FilterSet):
    # Advanced date filtering for published_date.
    published_date__gte = django_filters.DateFilter(field_name='published_date', lookup_expr='gte')
    published_date__lte = django_filters.DateFilter(field_name='published_date', lookup_expr='lte')

    # A case-insensitive contains filter on the title.
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')

    # Exact match filter on author name, case insensitive.
    author = django_filters.CharFilter(field_name='author', lookup_expr='iexact')

    # Numeric filters for price, allowing clients to filter by a price range.
    # price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    # price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Book
        # The fields here include our custom ones; note that we map URL parameters
        # to our FilterSet fields.
        fields = ['author', 'title', 'published_date__gte', 'published_date__lte',]