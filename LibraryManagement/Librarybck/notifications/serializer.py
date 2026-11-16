from rest_framework import serializers
from core.models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True,
    )
    channel_display = serializers.CharField(
        source="get_channel_display",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "subject",
            "message",
            "notification_type",
            "notification_type_display",
            "channel",
            "channel_display",
            "status",
            "status_display",
            "created_at",
            "sent_at",
            "read_at",
        ]
        read_only_fields = fields
