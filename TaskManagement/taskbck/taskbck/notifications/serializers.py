from rest_framework import serializers
from core.models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    recipient_username = serializers.CharField(
        source='recipient.username',
        read_only=True
    )

    task_title = serializers.CharField(
        source='task.title',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'recipient_username',
            'notification_type',
            'title',
            'message',
            'task',
            'task_title',
            'is_read',
            'read_at',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'recipient',
            'read_at',
            'created_at',
        ]