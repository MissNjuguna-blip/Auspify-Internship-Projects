from rest_framework.permissions import BasePermission


class IsSystemAdmin(BasePermission):
    """
    Allow access to system administrators.
    """

    def has_permission(self, request, view):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )