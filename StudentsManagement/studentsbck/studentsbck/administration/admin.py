
from django.contrib import admin

from core.models import School


# ============================================================
# SCHOOL ADMIN
# ============================================================

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "email",
        "phone_number",
        "created_at",
    )

    search_fields = (
        "name",
        "code",
        "email",
    )

    ordering = ("name",)

    readonly_fields = (
        "created_at",
        "updated_at",
    )
