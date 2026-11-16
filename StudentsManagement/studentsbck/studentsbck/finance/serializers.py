
from rest_framework import serializers

from core.models import FeeCategory, FeePayment


class FeeCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = FeeCategory

        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):

        if not value.strip():
            raise serializers.ValidationError(
                "Fee category name is required."
            )

        return value.strip()

class FeePaymentSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.__str__",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    class Meta:
        model = FeePayment

        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "amount",
            "payment_date",
            "reference_number",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_amount(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )

        return value

    def validate_reference_number(self, value):

        value = value.strip()

        queryset = FeePayment.objects.filter(
            reference_number=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Payment reference already exists."
            )

        return value
