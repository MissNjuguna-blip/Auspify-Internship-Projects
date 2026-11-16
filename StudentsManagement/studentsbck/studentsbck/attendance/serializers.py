
from rest_framework import serializers

from core.models import (
    Student,
    StudentAttendance,
    ClassRoom,
    AcademicYear,
    Term,
)


class StudentAttendanceSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.__str__",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    class Meta:
        model = StudentAttendance
        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "date",
            "status",
            "remarks",
        ]
        read_only_fields = ["id"]


class ClassroomAttendanceSerializer(serializers.Serializer):

    classroom = serializers.PrimaryKeyRelatedField(
        queryset=ClassRoom.objects.all()
    )

    academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all()
    )

    date = serializers.DateField()

    attendance = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )


class AttendanceUpdateSerializer(serializers.Serializer):

    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all()
    )

    date = serializers.DateField()

    status = serializers.ChoiceField(
        choices=StudentAttendance.STATUS_CHOICES
    )

    remarks = serializers.CharField(
        required=False,
        allow_blank=True,
    )
