from django.db.models import Count, Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Book, BookCopy, Shelf
from .serializers import (
    BookCopySerializer,
    ShelfSerializer,
    BookSummarySerializer,
)

class InventoryPermissionMixin:
    permission_classes = [IsAuthenticated]


class BookCopyViewSet(
    InventoryPermissionMixin,
    viewsets.ModelViewSet,
):
    serializer_class = BookCopySerializer
    queryset = BookCopy.objects.select_related(
        "book", "shelf"
    ).all()

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "barcode",
        "book__title",
        "book__isbn",
        "shelf__name",
    ]

    ordering_fields = [
        "barcode",
        "created_at",
        "acquisition_date",
        "status",
        "condition",
    ]
    ordering = ["barcode"]

    def get_queryset(self):
        queryset = super().get_queryset()

        copy_status = self.request.query_params.get("status")
        condition = self.request.query_params.get("condition")
        shelf_id = self.request.query_params.get("shelf")
        book_id = self.request.query_params.get("book")

        if copy_status:
            queryset = queryset.filter(status=copy_status)

        if condition:
            queryset = queryset.filter(condition=condition)

        if shelf_id:
            queryset = queryset.filter(shelf_id=shelf_id)

        if book_id:
            queryset = queryset.filter(book_id=book_id)

        return queryset

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        copies = BookCopy.objects.all()

        counts = {
            "total_copies": copies.count(),
            "available": copies.filter(
                status=BookCopy.Status.AVAILABLE
            ).count(),
            "on_loan": copies.filter(
                status=BookCopy.Status.ON_LOAN
            ).count(),
            "reserved": copies.filter(
                status=BookCopy.Status.RESERVED
            ).count(),
            "damaged": copies.filter(
                status=BookCopy.Status.DAMAGED
            ).count(),
            "lost": copies.filter(
                status=BookCopy.Status.LOST
            ).count(),
            "withdrawn": copies.filter(
                status=BookCopy.Status.WITHDRAWN
            ).count(),
            "total_titles": Book.objects.count(),
            "total_shelves": Shelf.objects.count(),
        }

        return Response(counts)


class ShelfViewSet(
    InventoryPermissionMixin,
    viewsets.ModelViewSet,
):
    serializer_class = ShelfSerializer
    queryset = Shelf.objects.annotate(
        copy_count=Count("copies")
    ).all()

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "location", "description"]
    ordering_fields = ["name", "location", "created_at"]
    ordering = ["name"]

    @action(detail=True, methods=["get"])
    def copies(self, request, pk=None):
        shelf = self.get_object()
        queryset = BookCopy.objects.filter(
            shelf=shelf
        ).select_related("book", "shelf")

        serializer = BookCopySerializer(
            queryset,
            many=True,
        )
        return Response(serializer.data)


class BookLookupViewSet(
    InventoryPermissionMixin,
    viewsets.ReadOnlyModelViewSet,
):
    queryset = Book.objects.prefetch_related("authors").all()
    serializer_class = BookSummarySerializer

    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "isbn", "authors__first_name",
                     "authors__last_name"]
