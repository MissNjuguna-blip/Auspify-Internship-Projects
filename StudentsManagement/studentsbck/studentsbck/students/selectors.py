
from core.models import (
    Student,
    Guardian,
    StudentGuardian,
    Enrollment,
)


# ============================================================
# STUDENT SELECTORS
# ============================================================

def get_all_students():
    return Student.objects.all().order_by(
        "first_name",
        "last_name"
    )


def get_student_by_id(student_id):
    return Student.objects.filter(
        id=student_id
    ).first()


def get_student_by_admission_number(admission_number):
    return Student.objects.filter(
        admission_number=admission_number
    ).first()


def search_students(query):
    return Student.objects.filter(
        first_name__icontains=query
    ) | Student.objects.filter(
        last_name__icontains=query
    ) | Student.objects.filter(
        admission_number__icontains=query
    )


def get_students_by_gender(gender):
    return Student.objects.filter(
        gender__iexact=gender
    )


def get_total_students():
    return Student.objects.count()


# ============================================================
# GUARDIAN SELECTORS
# ============================================================

def get_all_guardians():
    return Guardian.objects.all().order_by(
        "full_name"
    )


def get_guardian_by_id(guardian_id):
    return Guardian.objects.filter(
        id=guardian_id
    ).first()


def get_student_guardians(student):
    return StudentGuardian.objects.filter(
        student=student
    ).select_related("guardian")


# ============================================================
# ENROLLMENT SELECTORS
# ============================================================

def get_student_enrollments(student):
    return Enrollment.objects.filter(
        student=student
    ).select_related(
        "classroom",
        "academic_year"
    ).order_by("-academic_year__start_date")


def get_students_by_classroom(classroom_id):
    return Student.objects.filter(
        enrollments__classroom_id=classroom_id
    ).distinct()


def get_students_by_academic_year(academic_year_id):
    return Student.objects.filter(
        enrollments__academic_year_id=academic_year_id
    ).distinct()
