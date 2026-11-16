
from rest_framework.permissions import BasePermission


class IsCirculationStaff(BasePermission):
    """
    Allow authenticated library staff to manage circulation.
    """

    message = "Only authorized library staff can manage circulation."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and (
                request.user.is_staff
                or request.user.is_superuser
            )
        )
