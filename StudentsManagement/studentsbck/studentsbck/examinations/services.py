
from django.db import transaction
from django.core.exceptions import ValidationError

from core.models import (
    Examination,
    StudentResult,
    Enrollment,
    Student
)


@transaction.atomic
def create_examination(
    name,
    academic_year,
    term,
    start_date,
    end_date,
):
    if term.academic_year_id != academic_year.id:
        raise ValidationError(
            "Term does not belong to the selected academic year."
        )

    if start_date > end_date:
        raise ValidationError(
            "Examination start date cannot be after end date."
        )

    if not (
        academic_year.start_date <= start_date
        and end_date <= academic_year.end_date
    ):
        raise ValidationError(
            "Examination dates must fall within the academic year."
        )

    if not (
        term.start_date <= start_date
        and end_date <= term.end_date
    ):
        raise ValidationError(
            "Examination dates must fall within the selected term."
        )

    return Examination.objects.create(
        name=name,
        academic_year=academic_year,
        term=term,
        start_date=start_date,
        end_date=end_date,
    )

def update_examination(
    examination,
    name=None,
    academic_year=None,
    term=None,
    start_date=None,
    end_date=None,
):

    new_year = academic_year or examination.academic_year
    new_term = term or examination.term
    new_start = start_date or examination.start_date
    new_end = end_date or examination.end_date

    if new_term.academic_year_id != new_year.id:
        raise ValidationError(
            "Term does not belong to the selected academic year."
        )

    if new_start > new_end:
        raise ValidationError("Invalid examination dates.")

    if not (
        new_year.start_date <= new_start
        and new_end <= new_year.end_date
    ):
        raise ValidationError(
            "Examination dates are outside the academic year."
        )

    if not (
        new_term.start_date <= new_start
        and new_end <= new_term.end_date
    ):
        raise ValidationError(
            "Examination dates are outside the selected term."
        )

    examination.name = name if name is not None else examination.name
    examination.academic_year = new_year
    examination.term = new_term
    examination.start_date = new_start
    examination.end_date = new_end

    examination.save()

    return examination

from decimal import Decimal

from core.models import StudentResult


@transaction.atomic
def enter_student_result(
    student,
    examination,
    subject,
    marks,
    classroom=None,
):
    marks = Decimal(str(marks))

    if marks < 0:
        raise ValidationError(
            "Marks cannot be negative."
        )

    if marks > 100:
        raise ValidationError(
            "Marks cannot exceed 100."
        )

    if classroom:
        enrolled = Enrollment.objects.filter(
            student=student,
            classroom=classroom,
            academic_year=examination.academic_year,
        ).exists()

        if not enrolled:
            raise ValidationError(
                "Student is not enrolled in this classroom."
            )

    if examination.term.academic_year_id != examination.academic_year_id:
        raise ValidationError(
            "Examination has an invalid academic year and term combination."
        )

    result, created = StudentResult.objects.update_or_create(
        student=student,
        examination=examination,
        subject=subject,
        defaults={
            "marks": marks,
        },
    )

    return result

@transaction.atomic
def enter_classroom_results(
    classroom,
    examination,
    subject,
    results_data,
):
    """
    results_data format:
    {
        student_id: marks,
        student_id: marks,
    }
    """

    students = Enrollment.objects.filter(
        classroom=classroom,
        academic_year=examination.academic_year,
    ).values_list("student_id", flat=True)

    enrolled_ids = set(students)

    submitted_ids = set(results_data.keys())

    if not submitted_ids.issubset(enrolled_ids):
        raise ValidationError(
            "Some students are not enrolled in this classroom."
        )

    results = []

    for student_id, marks in results_data.items():

        result = enter_student_result(
            student=Student.objects.get(pk=student_id),
            examination=examination,
            subject=subject,
            marks=marks,
            classroom=classroom,
        )

        results.append(result)

    return results

def delete_student_result(result):

    result.delete()

    return True
