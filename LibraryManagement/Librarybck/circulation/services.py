
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.models import (
    BookCopy,
    Loan,
    LoanRenewal,
    Member,
)


@transaction.atomic
def issue_book(*, member_id, book_copy_id, issued_by, due_date, notes=""):
    member = Member.objects.select_for_update().filter(
        pk=member_id
    ).first()

    if member is None:
        raise ValidationError({"member": "Member not found."})

    today = timezone.localdate()

    if member.status != Member.Status.ACTIVE:
        raise ValidationError({
            "member": "This member is not active."
        })

    if member.expiry_date and member.expiry_date < today:
        raise ValidationError({
            "member": "This membership has expired."
        })

    if due_date < today:
        raise ValidationError({
            "due_date": "The due date cannot be in the past."
        })

    book_copy = BookCopy.objects.select_for_update().filter(
        pk=book_copy_id
    ).first()

    if book_copy is None:
        raise ValidationError({
            "book_copy": "Book copy not found."
        })

    if book_copy.status != BookCopy.Status.AVAILABLE:
        raise ValidationError({
            "book_copy": (
                f"This copy is not available. "
                f"Current status: {book_copy.status}."
            )
        })

    loan = Loan.objects.create(
        member=member,
        book_copy=book_copy,
        issued_by=issued_by,
        due_date=due_date,
        notes=notes,
        status=Loan.Status.ACTIVE,
    )

    book_copy.status = BookCopy.Status.ON_LOAN
    book_copy.save(update_fields=["status", "updated_at"])

    return loan


@transaction.atomic
def return_book(*, loan_id, returned_to, notes=None):
    loan = Loan.objects.select_for_update().filter(
        pk=loan_id
    ).first()

    if loan is None:
        raise ValidationError({"loan": "Loan not found."})

    if loan.status not in [
        Loan.Status.ACTIVE,
        Loan.Status.OVERDUE,
    ]:
        raise ValidationError({
            "loan": "This loan has already been closed."
        })

    book_copy = BookCopy.objects.select_for_update().get(
        pk=loan.book_copy_id
    )

    if book_copy.status != BookCopy.Status.ON_LOAN:
        raise ValidationError({
            "book_copy": (
                "The book copy is not currently marked as on loan."
            )
        })

    now = timezone.now()

    loan.return_date = now
    loan.returned_to = returned_to
    loan.status = Loan.Status.RETURNED

    if notes:
        loan.notes = (
            f"{loan.notes}\n{notes}".strip()
            if loan.notes else notes
        )

    loan.save()

    book_copy.status = BookCopy.Status.AVAILABLE
    book_copy.save(update_fields=["status", "updated_at"])

    return loan


@transaction.atomic
def renew_loan(
    *,
    loan_id,
    renewed_by,
    new_due_date,
    reason="",
):
    loan = Loan.objects.select_for_update().filter(
        pk=loan_id
    ).first()

    if loan is None:
        raise ValidationError({"loan": "Loan not found."})

    if loan.status not in [
        Loan.Status.ACTIVE,
        Loan.Status.OVERDUE,
    ]:
        raise ValidationError({
            "loan": "Only active or overdue loans can be renewed."
        })

    today = timezone.localdate()

    if new_due_date <= today:
        raise ValidationError({
            "new_due_date": "The new due date must be in the future."
        })

    if new_due_date <= loan.due_date:
        raise ValidationError({
            "new_due_date": (
                "The new due date must be later than the current due date."
            )
        })

    previous_due_date = loan.due_date

    LoanRenewal.objects.create(
        loan=loan,
        previous_due_date=previous_due_date,
        new_due_date=new_due_date,
        renewed_by=renewed_by,
        reason=reason,
    )

    loan.due_date = new_due_date
    loan.renewal_count += 1
    loan.status = Loan.Status.ACTIVE
    loan.save(
        update_fields=[
            "due_date",
            "renewal_count",
            "status",
            "updated_at",
        ]
    )

    return loan


def refresh_overdue_loans():
    """
    Mark loans overdue when their due dates have passed.

    Returned and lost loans are not changed.
    """
    today = timezone.localdate()

    return Loan.objects.filter(
        status=Loan.Status.ACTIVE,
        due_date__lt=today,
        return_date__isnull=True,
    ).update(status=Loan.Status.OVERDUE)
