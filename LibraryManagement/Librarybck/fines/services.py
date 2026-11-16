
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.models import Loan, Fine, FinePayment


def process_overdue_loans():
    """
    Update loan statuses for loans whose due dates have passed.

    This function does not create fines automatically because
    the library's fine rates and grace period are not specified.
    """

    today = timezone.localdate()

    updated = Loan.objects.filter(
        status=Loan.Status.ACTIVE,
        due_date__lt=today,
    ).update(status=Loan.Status.OVERDUE)

    return {
        "date": today,
        "loans_marked_overdue": updated,
    }


def get_outstanding_balance(fine):
    """Calculate the remaining amount due on a fine."""
    return max(
        fine.amount - fine.amount_paid,
        Decimal("0.00"),
    )


@transaction.atomic
def record_fine_payment(
    fine_id,
    amount,
    payment_method,
    received_by,
    transaction_reference="",
    notes="",
):
    """
    Record a payment against a fine and update its balance.

    Lock the fine row to prevent concurrent payments from
    exceeding the outstanding balance.
    """

    amount = Decimal(str(amount))

    if not amount.is_finite() or amount <= Decimal("0.00"):
        raise ValidationError(
            {"amount": "Payment must be a positive amount."}
        )

    fine = Fine.objects.select_for_update().get(pk=fine_id)

    if fine.status in (
        Fine.Status.PAID,
        Fine.Status.WAIVED,
    ):
        raise ValidationError(
            {"fine": "This fine is already settled or waived."}
        )

    balance = get_outstanding_balance(fine)

    if amount > balance:
        raise ValidationError(
            {"amount": f"Payment exceeds the outstanding balance of {balance}."}
        )

    valid_methods = {
        choice[0]
        for choice in FinePayment.PaymentMethod.choices
    }

    if payment_method not in valid_methods:
        raise ValidationError(
            {"payment_method": "Invalid payment method."}
        )

    payment = FinePayment.objects.create(
        fine=fine,
        amount=amount,
        payment_method=payment_method,
        transaction_reference=transaction_reference,
        received_by=received_by,
        notes=notes,
    )

    fine.amount_paid += amount

    if fine.amount_paid >= fine.amount:
        fine.status = Fine.Status.PAID
    else:
        fine.status = Fine.Status.PARTIAL

    fine.save(update_fields=["amount_paid", "status", "updated_at"])

    return payment
