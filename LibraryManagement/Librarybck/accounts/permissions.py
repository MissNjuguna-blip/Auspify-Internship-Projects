from rest_framework.permissions import BasePermission

class IsAdminOrSelf(BasePermission):
    """
    Allow staff to access any user's record.
    Regular users can access only their own record.
    """

    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.pk == request.user.pk
