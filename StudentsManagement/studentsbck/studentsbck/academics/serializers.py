
from rest_framework import serializers

from core.models import (
    AcademicYear,
    Term,
    ClassRoom,
    Subject,
    Enrollment,
)


# ============================================================
# ACADEMIC YEAR SERIALIZER
# ============================================================

class AcademicYearSerializer(serializers.ModelSerializer):

    class Meta:
        model = AcademicYear
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None)
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None)
        )

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(
                "End date must be after start date."
            )

        return attrs


# ============================================================
# TERM SERIALIZER
# ============================================================

class TermSerializer(serializers.ModelSerializer):

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True
    )

    class Meta:
        model = Term
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None)
        )

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None)
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None)
        )

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError(
                "Term end date must be after its start date."
            )

        if academic_year and start_date and end_date:
            if (
                start_date < academic_year.start_date
                or end_date > academic_year.end_date
            ):
                raise serializers.ValidationError(
                    "Term dates must fall within the academic year."
                )

        return attrs


# ============================================================
# CLASSROOM SERIALIZER
# ============================================================

class ClassRoomSerializer(serializers.ModelSerializer):

    class Meta:
        model = ClassRoom
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


# ============================================================
# SUBJECT SERIALIZER
# ============================================================

class SubjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


# ============================================================
# ENROLLMENT SERIALIZER
# ============================================================

class EnrollmentSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.__str__",
        read_only=True
    )

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
        fields = "__all__"
        read_only_fields = (
            "id",
            "enrollment_date",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None)
        )

        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None)
        )

        if student and academic_year:
            existing = Enrollment.objects.filter(
                student=student,
                academic_year=academic_year,
            )

            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise serializers.ValidationError(
                    "This student is already enrolled for this academic year."
                )

        return attrs
