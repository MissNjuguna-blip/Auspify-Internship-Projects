from django.urls import path

from notifications.views import (
    notification_list,
    notification_detail,
    mark_as_read,
    mark_all_as_read,
    delete_notification,
    clear_notifications,
    unread_count,
)

urlpatterns = [
    path('', notification_list, name='notification-list'),

    path(
        'unread-count/',
        unread_count,
        name='unread-count'
    ),

    path(
        'mark-all-read/',
        mark_all_as_read,
        name='mark-all-read'
    ),

    path(
        'clear/',
        clear_notifications,
        name='clear-notifications'
    ),

    path(
        '<uuid:pk>/',
        notification_detail,
        name='notification-detail'
    ),

    path(
        '<uuid:pk>/read/',
        mark_as_read,
        name='mark-as-read'
    ),

    path(
        '<uuid:pk>/delete/',
        delete_notification,
        name='delete-notification'
    ),
]