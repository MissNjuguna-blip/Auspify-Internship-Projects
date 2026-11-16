from rest_framework import serializers
from core.models import Book, BookCopy, Shelf

class ShelfSerializer(serializers.ModelSerializer):
    copy_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Shelf
        fields = [
            "id",
            "name",
            "location",
            "description",
            "created_at",
            "updated_at",
            "copy_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BookSummarySerializer(serializers.ModelSerializer):
    authors_display = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ["id", "title", "isbn", "authors_display"]

    def get_authors_display(self, obj):
        return ", ".join(
            str(author) for author in obj.authors.all()
        )


class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(
        source="book.title",
        read_only=True,
    )
    shelf_name = serializers.CharField(
        source="shelf.name",
        read_only=True,
        default=None,
    )
    book_details = BookSummarySerializer(
        source="book",
        read_only=True,
    )

    class Meta:
        model = BookCopy
        fields = [
            "id",
            "book",
            "book_title",
            "book_details",
            "barcode",
            "shelf",
            "shelf_name",
            "status",
            "condition",
            "acquisition_date",
            "acquisition_price",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        book_copy = self.instance

        # Prevent changing a copy's status to AVAILABLE
        # while an active loan still exists.
        if book_copy and "status" in attrs:
            if attrs["status"] == BookCopy.Status.AVAILABLE:
                from circulation.models import Loan

                active_loan = Loan.objects.filter(
                    book_copy=book_copy,
                    status__in=[
                        Loan.Status.ACTIVE,
                        Loan.Status.OVERDUE,
                    ],
                ).exists()

                if active_loan:
                    raise serializers.ValidationError({
                        "status": (
                            "This copy has an active loan. "
                            "Return the book through circulation first."
                        )
                    })

        return attrs