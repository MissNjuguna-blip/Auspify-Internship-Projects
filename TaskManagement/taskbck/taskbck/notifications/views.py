
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Notification
from notifications.serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):

    notifications = Notification.objects.filter(
        recipient=request.user
    )

    serializer = NotificationSerializer(
        notifications,
        many=True
    )

    return Response({
        'count': notifications.count(),
        'unread_count': notifications.filter(
            is_read=False
        ).count(),
        'notifications': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_detail(request, pk):

    notification = Notification.objects.filter(
        id=pk,
        recipient=request.user
    ).first()

    if not notification:
        return Response(
            {'error': 'Notification not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        NotificationSerializer(notification).data
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, pk):

    notification = Notification.objects.filter(
        id=pk,
        recipient=request.user
    ).first()

    if not notification:
        return Response(
            {'error': 'Notification not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    notification.mark_as_read()

    return Response({
        'message': 'Notification marked as read.',
        'notification': NotificationSerializer(
            notification
        ).data
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):

    now = timezone.now()

    updated = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(
        is_read=True,
        read_at=now
    )

    return Response({
        'message': 'All notifications marked as read.',
        'updated_count': updated
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):

    notification = Notification.objects.filter(
        id=pk,
        recipient=request.user
    ).first()

    if not notification:
        return Response(
            {'error': 'Notification not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    notification.delete()

    return Response(
        {'message': 'Notification deleted successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_notifications(request):

    deleted, _ = Notification.objects.filter(
        recipient=request.user
    ).delete()

    return Response({
        'message': 'Notifications cleared successfully.',
        'deleted_count': deleted
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):

    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()

    return Response({
        'unread_count': count
    })
