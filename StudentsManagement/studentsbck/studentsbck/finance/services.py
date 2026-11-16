
from django.core.exceptions import ValidationError
from django.db import transaction

from core.models import (
    FeeCategory,
    FeePayment,
)


@transaction.atomic
def create_fee_category(name, description=""):

    if not name.strip():
        raise ValidationError(
            "Fee category name is required."
        )

    if FeeCategory.objects.filter(
        name__iexact=name.strip()
    ).exists():
        raise ValidationError(
            "This fee category already exists."
        )

    return FeeCategory.objects.create(
        name=name.strip(),
        description=description,
    )

def update_fee_category(
    category,
    name=None,
    description=None,
):

    if name is not None:
        if not name.strip():
            raise ValidationError(
                "Category name cannot be empty."
            )

        category.name = name.strip()

    if description is not None:
        category.description = description

    category.save()

    return category

def delete_fee_category(category):

    category.delete()

    return True

from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError

from core.models import FeePayment, Student


@transaction.atomic
def record_student_payment(
    student,
    amount,
    payment_date,
    reference_number,
):

    amount = Decimal(str(amount))

    if amount <= 0:
        raise ValidationError(
            "Payment amount must be greater than zero."
        )

    if not reference_number.strip():
        raise ValidationError(
            "Payment reference number is required."
        )

    if FeePayment.objects.filter(
        reference_number=reference_number.strip()
    ).exists():
        raise ValidationError(
            "This payment reference already exists."
        )

    payment = FeePayment.objects.create(
        student=student,
        amount=amount,
        payment_date=payment_date,
        reference_number=reference_number.strip(),
    )

    return payment

def update_student_payment(
    payment,
    amount=None,
    payment_date=None,
):

    if amount is not None:
        amount = Decimal(str(amount))

        if amount <= 0:
            raise ValidationError(
                "Payment amount must be greater than zero."
            )

        payment.amount = amount

    if payment_date is not None:
        payment.payment_date = payment_date

    payment.save()

    return payment
