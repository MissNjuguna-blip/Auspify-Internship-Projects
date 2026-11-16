
from rest_framework import serializers

from core.models import (
    Student,
    Guardian,
    StudentGuardian,
    Enrollment,
)


class StudentSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Student

        fields = [
            "id",
            "admission_number",
            "first_name",
            "last_name",
            "other_names",
            "full_name",
            "date_of_birth",
            "gender",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return str(obj)


class GuardianSerializer(serializers.ModelSerializer):

    class Meta:
        model = Guardian

        fields = [
            "id",
            "full_name",
            "phone_number",
            "email",
            "relationship",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class StudentGuardianSerializer(serializers.ModelSerializer):

    guardian_name = serializers.CharField(
        source="guardian.full_name",
        read_only=True
    )

    guardian_phone = serializers.CharField(
        source="guardian.phone_number",
        read_only=True
    )

    class Meta:
        model = StudentGuardian

        fields = [
            "id",
            "student",
            "guardian",
            "guardian_name",
            "guardian_phone",
            "is_primary",
        ]

        read_only_fields = [
            "id",
        ]

class EnrollmentSerializer(serializers.ModelSerializer):

    classroom_name = serializers.CharField(
        source="classroom.name",
        read_only=True
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True
    )

    class Meta:
        model = Enrollment

        fields = [
            "id",
            "student",
            "classroom",
            "classroom_name",
            "academic_year",
            "academic_year_name",
            "enrollment_date",
        ]

        read_only_fields = [
            "id",
            "enrollment_date",
        ]
