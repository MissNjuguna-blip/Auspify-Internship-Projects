
from rest_framework.permissions import BasePermission


class CanManageExaminations(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class CanViewExaminations(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
        )
