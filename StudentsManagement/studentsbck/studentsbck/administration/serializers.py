
from rest_framework import serializers

from core.models import School


# ============================================================
# SCHOOL SERIALIZER
# ============================================================

class SchoolSerializer(serializers.ModelSerializer):

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "code",
            "address",
            "email",
            "phone_number",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value):
        value = value.strip().upper()

        queryset = School.objects.filter(code__iexact=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A school with this code already exists."
            )

        return value


# ============================================================
# SCHOOL SUMMARY SERIALIZER
# ============================================================

class SchoolSummarySerializer(serializers.ModelSerializer):

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "code",
            "email",
            "phone_number",
        ]
