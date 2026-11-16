from django.contrib import admin
from core.models import Member

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = (
        "membership_number",
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "membership_type",
        "status",
        "joined_date",
        "expiry_date",
    )

    list_filter = (
        "membership_type",
        "status",
        "joined_date",
    )

    search_fields = (
        "membership_number",
        "first_name",
        "last_name",
        "email",
        "phone_number",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("last_name", "first_name")
    date_hierarchy = "joined_date"
