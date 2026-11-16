
from django.db import transaction
from django.core.exceptions import ValidationError

from core.models import StudentAttendance

from .selectors import get_classroom_students


@transaction.atomic
def mark_classroom_attendance(
    classroom,
    academic_year,
    attendance_date,
    attendance_data,
):
    students = get_classroom_students(
        classroom,
        academic_year,
    )

    if not students.exists():
        raise ValidationError(
            "No students enrolled in this classroom."
        )

    valid_statuses = dict(
        StudentAttendance.STATUS_CHOICES
    )

    records = []

    for student in students:
        status = attendance_data.get(
            student.id,
            "present",
        )

        if status not in valid_statuses:
            raise ValidationError(
                f"Invalid attendance status for {student}."
            )

        records.append(
            StudentAttendance(
                student=student,
                date=attendance_date,
                status=status,
            )
        )

    for record in records:
        StudentAttendance.objects.update_or_create(
            student=record.student,
            date=record.date,
            defaults={
                "status": record.status,
            },
        )

    return records


@transaction.atomic
def update_student_attendance(
    student,
    attendance_date,
    status,
    remarks="",
):
    valid_statuses = dict(
        StudentAttendance.STATUS_CHOICES
    )

    if status not in valid_statuses:
        raise ValidationError("Invalid attendance status.")

    attendance, created = StudentAttendance.objects.update_or_create(
        student=student,
        date=attendance_date,
        defaults={
            "status": status,
            "remarks": remarks,
        },
    )

    return attendance
