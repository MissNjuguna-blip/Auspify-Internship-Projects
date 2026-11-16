
from django.contrib import admin

from core.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "actor",
        "action",
        "entity_type",
        "entity_id",
        "created_at",
    )

    list_filter = (
        "action",
        "entity_type",
        "created_at",
    )

    search_fields = (
        "actor__username",
        "entity_type",
        "entity_id",
        "description",
    )

    readonly_fields = (
        "actor",
        "action",
        "entity_type",
        "entity_id",
        "description",
        "changes",
        "ip_address",
        "user_agent",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
