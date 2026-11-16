from django.contrib import admin
from core.models import Shelf, BookCopy

@admin.register(Shelf)
class ShelfAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "location",
        "created_at",
    )
    search_fields = (
        "name",
        "location",
    )
    ordering = ("name",)


@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = (
        "barcode",
        "book",
        "shelf",
        "status",
        "condition",
        "acquisition_date",
    )

    list_filter = (
        "status",
        "condition",
        "shelf",
        "acquisition_date",
    )

    search_fields = (
        "barcode",
        "book__title",
        "book__isbn",
    )

    autocomplete_fields = (
        "book",
        "shelf",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "book",
        "shelf",
    )

    list_per_page = 25
