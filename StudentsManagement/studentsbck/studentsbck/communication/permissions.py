
from rest_framework.permissions import BasePermission


class CanManageAnnouncements(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class CanViewAnnouncements(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
        )
