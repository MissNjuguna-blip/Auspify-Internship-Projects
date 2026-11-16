from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Notification
from notifications.permissions import IsMemberNotificationOwner
from notifications.serializer import NotificationSerializer


class MemberNotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [
        IsAuthenticated,
        IsMemberNotificationOwner,
    ]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
            channel=Notification.Channel.IN_APP,
        ).order_by("-created_at")


class MemberUnreadCountView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMemberNotificationOwner,
    ]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            channel=Notification.Channel.IN_APP,
            read_at__isnull=True,
        ).count()

        return Response({"unread_count": count})


class MemberMarkReadView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMemberNotificationOwner,
    ]

    def post(self, request, pk):
        notification = generics.get_object_or_404(
            Notification,
            pk=pk,
            recipient=request.user,
            channel=Notification.Channel.IN_APP,
        )

        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.status = Notification.Status.READ
            notification.save(
                update_fields=["read_at", "status", "updated_at"]
            )

        return Response(
            {"detail": "Notification marked as read."},
            status=status.HTTP_200_OK,
        )


class MemberMarkAllReadView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMemberNotificationOwner,
    ]

    def post(self, request):
        now = timezone.now()

        updated = Notification.objects.filter(
            recipient=request.user,
            channel=Notification.Channel.IN_APP,
            read_at__isnull=True,
        ).update(
            read_at=now,
            status=Notification.Status.READ,
            updated_at=now,
        )

        return Response({"updated_count": updated})
