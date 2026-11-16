
from core.models import (
    Student,
    StudentAttendance,
    Enrollment,
)


def get_classroom_students(classroom, academic_year):
    return Student.objects.filter(
        enrollments__classroom=classroom,
        enrollments__academic_year=academic_year,
    ).distinct().order_by("first_name")


def get_attendance_record(student, attendance_date):
    return StudentAttendance.objects.filter(
        student=student,
        date=attendance_date,
    ).first()


def get_daily_attendance(classroom, academic_year, attendance_date):
    students = get_classroom_students(
        classroom,
        academic_year,
    )

    return StudentAttendance.objects.filter(
        student__in=students,
        date=attendance_date,
    ).select_related("student")


def get_student_attendance(student, start_date=None, end_date=None):
    records = StudentAttendance.objects.filter(
        student=student
    )

    if start_date:
        records = records.filter(date__gte=start_date)

    if end_date:
        records = records.filter(date__lte=end_date)

    return records.order_by("-date")
