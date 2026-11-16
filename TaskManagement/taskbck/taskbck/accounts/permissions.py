
from rest_framework.permissions import BasePermission


# =====================================================
# AUTHENTICATED USER PERMISSION
# =====================================================

class IsAuthenticatedUser(BasePermission):

    message = 'You must be logged in to access this resource.'

    def has_permission(self, request, view):

        return bool(
            request.user and
            request.user.is_authenticated
        )


# =====================================================
# PERSONAL OBJECT OWNERSHIP
# =====================================================

class IsOwner(BasePermission):

    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):

        # User-owned objects
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.pk

        # User-created objects
        if hasattr(obj, 'created_by_id'):
            return obj.created_by_id == request.user.pk

        # Personal user profile
        if hasattr(obj, 'pk'):
            return obj.pk == request.user.pk

        return False
