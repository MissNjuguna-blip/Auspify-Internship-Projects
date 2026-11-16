from django.contrib import admin
from core.models import Book


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "isbn")
    search_fields = ("title", "isbn")
    ordering = ("title",)