from rest_framework import serializers
from core.models import (
    Author,
    Publisher,
    Category,
    Book,
    Shelf,
    BookCopy,
)

class AuthorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = Author
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "biography",
            "email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = [
            "id",
            "name",
            "email",
            "phone_number",
            "website",
            "address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(
        source="book.title",
        read_only=True,
    )
    shelf_name = serializers.CharField(
        source="shelf.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = BookCopy
        fields = [
            "id",
            "book",
            "book_title",
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
        read_only_fields = ["id", "created_at", "updated_at"]


class ShelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelf
        fields = [
            "id",
            "name",
            "location",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BookSerializer(serializers.ModelSerializer):
    # Writable relationships use lists of database IDs.
    authors = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Author.objects.all(),
    )
    categories = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Category.objects.all(),
    )
    publisher = serializers.PrimaryKeyRelatedField(
        queryset=Publisher.objects.all(),
        allow_null=True,
        required=False,
    )

    # Additional information for displaying books.
    author_names = serializers.SerializerMethodField()
    category_names = serializers.SerializerMethodField()
    publisher_name = serializers.CharField(
        source="publisher.name",
        read_only=True,
        allow_null=True,
    )
    copies_count = serializers.IntegerField(
        source="copies.count",
        read_only=True,
    )

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "subtitle",
            "isbn",
            "authors",
            "author_names",
            "publisher",
            "publisher_name",
            "categories",
            "category_names",
            "edition",
            "publication_year",
            "language",
            "description",
            "cover_image",
            "page_count",
            "copies_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "author_names",
            "category_names",
            "publisher_name",
            "copies_count",
        ]

    def get_author_names(self, obj):
        return [
            f"{author.first_name} {author.last_name}".strip()
            for author in obj.authors.all()
        ]

    def get_category_names(self, obj):
        return [category.name for category in obj.categories.all()]
