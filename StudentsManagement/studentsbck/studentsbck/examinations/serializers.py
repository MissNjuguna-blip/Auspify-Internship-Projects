
from rest_framework import serializers

from core.models import (
    Examination,
    StudentResult,
    AcademicYear,
    Term,
    Student,
    Subject,
)


class ExaminationSerializer(serializers.ModelSerializer):

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True,
    )

    class Meta:
        model = Examination

        fields = [
            "id",
            "name",
            "academic_year",
            "academic_year_name",
            "term",
            "term_name",
            "start_date",
            "end_date",
            "created_at",
        ]

        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None),
        )

        term = attrs.get(
            "term",
            getattr(self.instance, "term", None),
        )

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if academic_year and term:
            if term.academic_year_id != academic_year.id:
                raise serializers.ValidationError(
                    "Term does not belong to the selected academic year."
                )

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                "Invalid examination dates."
            )

        return attrs


class StudentResultSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.__str__",
        read_only=True,
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )

    class Meta:
        model = StudentResult

        fields = [
            "id",
            "student",
            "student_name",
            "examination",
            "subject",
            "subject_name",
            "marks",
            "created_at",
        ]

        read_only_fields = ["id", "created_at"]

    def validate_marks(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Marks must be between 0 and 100."
            )

        return value


class ClassroomResultsSerializer(serializers.Serializer):

    classroom = serializers.IntegerField()
    examination = serializers.IntegerField()
    subject = serializers.IntegerField()

    results = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )
