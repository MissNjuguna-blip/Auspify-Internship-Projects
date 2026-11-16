
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from core.models import Staff

User = get_user_model()


@transaction.atomic
def create_staff(
    username,
    email,
    password,
    first_name,
    last_name,
    staff_number,
    designation,
    employment_date=None,
    phone_number="",
):

    if Staff.objects.filter(
        staff_number=staff_number
    ).exists():
        raise ValidationError(
            "Staff number already exists."
        )

    if User.objects.filter(username=username).exists():
        raise ValidationError(
            "Username already exists."
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
    )

    staff = Staff.objects.create(
        user=user,
        staff_number=staff_number,
        designation=designation,
        employment_date=employment_date,
    )

    return staff

@transaction.atomic
def update_staff(
    staff,
    first_name=None,
    last_name=None,
    email=None,
    phone_number=None,
    staff_number=None,
    designation=None,
    employment_date=None,
):

    user = staff.user

    if first_name is not None:
        user.first_name = first_name

    if last_name is not None:
        user.last_name = last_name

    if email is not None:
        user.email = email

    if phone_number is not None:
        user.phone_number = phone_number

    user.save()

    if staff_number is not None:
        if Staff.objects.exclude(
            pk=staff.pk
        ).filter(
            staff_number=staff_number
        ).exists():
            raise ValidationError(
                "Staff number already exists."
            )

        staff.staff_number = staff_number

    if designation is not None:
        staff.designation = designation

    if employment_date is not None:
        staff.employment_date = employment_date

    staff.save()

    return staff

def update_staff_password(staff, new_password):

    if not new_password:
        raise ValidationError(
            "Password cannot be empty."
        )

    staff.user.set_password(new_password)
    staff.user.save()

    return True

def toggle_staff_status(staff, is_active):

    staff.user.is_active = is_active
    staff.user.save(update_fields=["is_active"])

    return staff


def deactivate_staff(staff):

    return toggle_staff_status(
        staff,
        False
    )


def activate_staff(staff):

    return toggle_staff_status(
        staff,
        True
    )

def delete_staff(staff):

    user = staff.user

    staff.delete()
    user.delete()

    return True
