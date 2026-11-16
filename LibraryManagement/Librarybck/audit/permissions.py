
from rest_framework.permissions import BasePermission


class IsAuditStaff(BasePermission):
    """
    Only authenticated staff members may access audit records.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_staff
        )
