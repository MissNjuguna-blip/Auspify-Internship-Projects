from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from core.models import (
    Author,
    Publisher,
    Category,
    Book,
    Shelf,
    BookCopy,
)
from books.serializer import (
    AuthorSerializer,
    PublisherSerializer,
    CategorySerializer,
    BookSerializer,
    ShelfSerializer,
    BookCopySerializer,
)
from books.permissions import IsStaffOrReadOnly

class AuthorViewSet(viewsets.ModelViewSet):
    serializer_class = AuthorSerializer
    permission_classes = [IsStaffOrReadOnly]
    queryset = Author.objects.annotate(
        book_count=Count("books", distinct=True)
    ).order_by("last_name", "first_name")

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "biography",
        "books__title",
    ]

    ordering_fields = [
        "first_name",
        "last_name",
        "created_at",
    ]
    ordering = ["last_name", "first_name"]


class PublisherViewSet(viewsets.ModelViewSet):
    """
    Manage publishers.
    """

    serializer_class = PublisherSerializer
    permission_classes = [IsStaffOrReadOnly]

    queryset = Publisher.objects.all()

    search_fields = [
        "name",
        "email",
        "phone_number",
        "address",
    ]

    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Manage book categories.
    """

    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]

    queryset = Category.objects.annotate(
        book_count=Count("books", distinct=True)
    ).order_by("name")

    search_fields = ["name", "description"]

    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class ShelfViewSet(viewsets.ModelViewSet):
    """
    Manage library shelves.
    """

    serializer_class = ShelfSerializer
    permission_classes = [IsStaffOrReadOnly]

    queryset = Shelf.objects.all()

    search_fields = ["name", "location", "description"]

    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class BookViewSet(viewsets.ModelViewSet):
    """
    Manage the book catalog.

    Supports searching, filtering, ordering, and availability checks.
    """

    serializer_class = BookSerializer
    permission_classes = [IsStaffOrReadOnly]

    queryset = (
        Book.objects
        .select_related("publisher")
        .prefetch_related("authors", "categories")
        .annotate(
            copies_count=Count("copies", distinct=True)
        )
        .order_by("title")
    )

    search_fields = [
        "title",
        "subtitle",
        "isbn",
        "authors__first_name",
        "authors__last_name",
        "publisher__name",
        "categories__name",
        "description",
    ]

    filterset_fields = [
        "publisher",
        "categories",
        "authors",
        "publication_year",
        "language",
    ]

    ordering_fields = [
        "title",
        "publication_year",
        "created_at",
        "updated_at",
    ]
    ordering = ["title"]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Optional availability filter:
        # ?available=true
        available = self.request.query_params.get("available")

        if available is not None:
            if available.lower() in ("true", "1", "yes"):
                queryset = queryset.filter(
                    copies__status=BookCopy.Status.AVAILABLE
                ).distinct()

            elif available.lower() in ("false", "0", "no"):
                queryset = queryset.exclude(
                    copies__status=BookCopy.Status.AVAILABLE
                ).distinct()

        return queryset

    @action(detail=True, methods=["get"])
    def copies(self, request, pk=None):
        """
        GET /api/books/{id}/copies/

        Return all physical copies of a book.
        """

        book = self.get_object()

        copies = (
            BookCopy.objects
            .filter(book=book)
            .select_related("book", "shelf")
            .order_by("barcode")
        )

        page = self.paginate_queryset(copies)

        if page is not None:
            serializer = BookCopySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = BookCopySerializer(copies, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def availability(self, request, pk=None):
        """
        GET /api/books/{id}/availability/

        Return physical copy counts by status.
        """

        book = self.get_object()

        counts = {
            item["status"]: item["total"]
            for item in (
                BookCopy.objects
                .filter(book=book)
                .values("status")
                .annotate(total=Count("id"))
            )
        }

        total_copies = sum(counts.values())
        available_copies = counts.get(
            BookCopy.Status.AVAILABLE, 0
        )

        return Response({
            "book_id": book.id,
            "title": book.title,
            "total_copies": total_copies,
            "available_copies": available_copies,
            "unavailable_copies": (
                total_copies - available_copies
            ),
            "status_counts": counts,
            "is_available": available_copies > 0,
        })


class BookCopyViewSet(viewsets.ModelViewSet):
    """
    Manage individual physical copies of books.

    Each copy has its own barcode, shelf, condition, and status.
    """

    serializer_class = BookCopySerializer
    permission_classes = [IsStaffOrReadOnly]

    queryset = (
        BookCopy.objects
        .select_related("book", "shelf")
        .order_by("barcode")
    )

    search_fields = [
        "barcode",
        "book__title",
        "book__isbn",
        "shelf__name",
    ]

    filterset_fields = [
        "book",
        "shelf",
        "status",
        "condition",
    ]

    ordering_fields = [
        "barcode",
        "acquisition_date",
        "acquisition_price",
        "created_at",
    ]
    ordering = ["barcode"]
