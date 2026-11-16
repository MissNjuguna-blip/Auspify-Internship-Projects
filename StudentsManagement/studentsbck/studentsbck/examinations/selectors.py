
from core.models import (
    Examination,
    StudentResult,
    Student,
    Enrollment,
)


def get_all_examinations():
    return Examination.objects.select_related(
        "academic_year",
        "term",
    ).order_by("-start_date")


def get_examination_by_id(examination_id):
    return Examination.objects.filter(
        id=examination_id
    ).select_related(
        "academic_year",
        "term",
    ).first()


def get_examinations_by_term(term):
    return Examination.objects.filter(
        term=term
    ).order_by("-start_date")


def get_examinations_by_academic_year(academic_year):
    return Examination.objects.filter(
        academic_year=academic_year
    ).order_by("-start_date")


def get_examination_results(examination):
    return StudentResult.objects.filter(
        examination=examination
    ).select_related(
        "student",
        "subject",
        "examination",
    )


def get_student_results(student, examination=None):
    results = StudentResult.objects.filter(
        student=student
    ).select_related(
        "subject",
        "examination",
    )

    if examination:
        results = results.filter(
            examination=examination
        )

    return results


def get_classroom_students(classroom, academic_year):
    return Student.objects.filter(
        enrollments__classroom=classroom,
        enrollments__academic_year=academic_year,
    ).distinct().order_by("first_name")
