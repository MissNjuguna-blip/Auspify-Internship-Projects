
from rest_framework import serializers

from core.models import Staff


class StaffSerializer(serializers.ModelSerializer):

    first_name = serializers.CharField(
        source="user.first_name"
    )

    last_name = serializers.CharField(
        source="user.last_name"
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email"
    )

    phone_number = serializers.CharField(
        source="user.phone_number",
        required=False
    )

    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True
    )

    class Meta:
        model = Staff

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "staff_number",
            "designation",
            "employment_date",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "is_active",
            "created_at",
            "updated_at",
        ]

class StaffCreateSerializer(serializers.Serializer):

    username = serializers.CharField(
        max_length=150
    )

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    first_name = serializers.CharField(
        max_length=150
    )

    last_name = serializers.CharField(
        max_length=150
    )

    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True
    )

    staff_number = serializers.CharField(
        max_length=50
    )

    designation = serializers.CharField(
        max_length=100
    )

    employment_date = serializers.DateField(
        required=False,
        allow_null=True
    )
