
from rest_framework import serializers

from core.models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Announcement

        fields = [
            "id",
            "title",
            "message",
            "created_by",
            "created_by_name",
            "published",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "published",
            "created_at",
            "updated_at",
        ]


class AnnouncementCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Announcement

        fields = [
            "title",
            "message",
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Announcement title cannot be empty."
            )

        return value

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Announcement message cannot be empty."
            )

        return value
