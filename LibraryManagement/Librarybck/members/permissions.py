from rest_framework.permissions import BasePermission

class IsLibraryStaff(BasePermission):
    """Allow authenticated library staff to manage members."""

    message = "Only authorized library staff can manage members."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_staff
        )
