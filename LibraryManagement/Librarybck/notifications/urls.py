from django.urls import path

from notifications.views import (
    MemberNotificationListView,
    MemberUnreadCountView,
    MemberMarkReadView,
    MemberMarkAllReadView,
)

urlpatterns = [
    path(
        "member/",
        MemberNotificationListView.as_view(),
        name="member-notifications",
    ),
    path(
        "member/unread-count/",
        MemberUnreadCountView.as_view(),
        name="member-notification-unread-count",
    ),
    path(
        "member/mark-all-read/",
        MemberMarkAllReadView.as_view(),
        name="member-notification-mark-all-read",
    ),
    path(
        "member/<int:pk>/mark-read/",
        MemberMarkReadView.as_view(),
        name="member-notification-mark-read",
    ),
]
