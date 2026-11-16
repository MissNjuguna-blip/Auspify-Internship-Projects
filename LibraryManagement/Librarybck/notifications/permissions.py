from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsMemberNotificationOwner(BasePermission):
    """
    Members can only view or update their own notifications.
    Staff access is handled by separate staff endpoints.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "membership")
        )

    def has_object_permission(self, request, view, obj):
        return obj.recipient_id == request.user.id
