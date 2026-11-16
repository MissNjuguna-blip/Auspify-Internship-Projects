
from rest_framework.permissions import BasePermission


# ============================================================
# SYSTEM ADMINISTRATOR PERMISSION
# ============================================================

class IsSystemAdmin(BasePermission):
    """
    Only authenticated system superusers can access
    administration endpoints.
    """

    def has_permission(self, request, view):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )
