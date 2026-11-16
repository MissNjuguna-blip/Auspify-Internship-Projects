
from django.db import transaction
from django.core.exceptions import ValidationError

from core.models import (
    Student,
    Guardian,
    StudentGuardian,
    Enrollment,
    AcademicYear,
)


@transaction.atomic
def register_student(
    admission_number,
    first_name,
    last_name,
    other_names="",
    date_of_birth=None,
    gender="",
):

    admission_number = admission_number.strip()

    if not admission_number:
        raise ValidationError(
            "Admission number is required."
        )

    if Student.objects.filter(
        admission_number=admission_number
    ).exists():
        raise ValidationError(
            "Admission number already exists."
        )

    if not first_name.strip():
        raise ValidationError(
            "First name is required."
        )

    if not last_name.strip():
        raise ValidationError(
            "Last name is required."
        )

    student = Student.objects.create(
        admission_number=admission_number,
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        other_names=other_names.strip(),
        date_of_birth=date_of_birth,
        gender=gender,
    )

    return student


def update_student(
    student,
    admission_number=None,
    first_name=None,
    last_name=None,
    other_names=None,
    date_of_birth=None,
    gender=None,
):

    if admission_number is not None:

        admission_number = admission_number.strip()

        if not admission_number:
            raise ValidationError(
                "Admission number cannot be empty."
            )

        if Student.objects.exclude(
            pk=student.pk
        ).filter(
            admission_number=admission_number
        ).exists():
            raise ValidationError(
                "Admission number already exists."
            )

        student.admission_number = admission_number

    if first_name is not None:
        if not first_name.strip():
            raise ValidationError(
                "First name cannot be empty."
            )

        student.first_name = first_name.strip()

    if last_name is not None:
        if not last_name.strip():
            raise ValidationError(
                "Last name cannot be empty."
            )

        student.last_name = last_name.strip()

    if other_names is not None:
        student.other_names = other_names.strip()

    if date_of_birth is not None:
        student.date_of_birth = date_of_birth

    if gender is not None:
        student.gender = gender

    student.save()

    return student

def delete_student(student):

    student.delete()

    return True

@transaction.atomic
def create_guardian(
    full_name,
    phone_number,
    email="",
    relationship="",
):

    if not full_name.strip():
        raise ValidationError(
            "Guardian name is required."
        )

    if not phone_number.strip():
        raise ValidationError(
            "Guardian phone number is required."
        )

    guardian = Guardian.objects.create(
        full_name=full_name.strip(),
        phone_number=phone_number.strip(),
        email=email,
        relationship=relationship,
    )

    return guardian

@transaction.atomic
def assign_guardian(
    student,
    guardian,
    is_primary=False,
):

    existing = StudentGuardian.objects.filter(
        student=student,
        guardian=guardian
    ).first()

    if existing:
        raise ValidationError(
            "Guardian is already linked to this student."
        )

    if is_primary:
        StudentGuardian.objects.filter(
            student=student,
            is_primary=True
        ).update(is_primary=False)

    relationship = StudentGuardian.objects.create(
        student=student,
        guardian=guardian,
        is_primary=is_primary,
    )

    return relationship

def remove_guardian(student, guardian):

    relationship = StudentGuardian.objects.filter(
        student=student,
        guardian=guardian
    ).first()

    if not relationship:
        raise ValidationError(
            "Guardian relationship does not exist."
        )

    relationship.delete()

    return True

@transaction.atomic
def set_primary_guardian(student, guardian):

    relationship = StudentGuardian.objects.filter(
        student=student,
        guardian=guardian
    ).first()

    if not relationship:
        raise ValidationError(
            "Guardian is not linked to this student."
        )

    StudentGuardian.objects.filter(
        student=student,
        is_primary=True
    ).update(is_primary=False)

    relationship.is_primary = True
    relationship.save(update_fields=["is_primary"])

    return relationship

@transaction.atomic
def enroll_student(
    student,
    classroom,
    academic_year,
):

    if academic_year.end_date < academic_year.start_date:
        raise ValidationError(
            "Invalid academic year dates."
        )

    if Enrollment.objects.filter(
        student=student,
        academic_year=academic_year
    ).exists():
        raise ValidationError(
            "Student is already enrolled for this academic year."
        )

    enrollment = Enrollment.objects.create(
        student=student,
        classroom=classroom,
        academic_year=academic_year,
    )

    return enrollment
