from datetime import date
from django.db.models import (
    Count,
    Sum,
    F,
    Q,
    DecimalField,
    ExpressionWrapper,
)
from django.db.models.functions import TruncMonth
from django.utils import timezone
from core.models import Book, Member, BookCopy, Loan, Fine, FinePayment, AuditLog

def dashboard_report():
    """Return the main library dashboard statistics."""
    today = timezone.localdate()

    return {
        "total_titles": Book.objects.count(),
        "total_copies": BookCopy.objects.count(),
        "available_copies": BookCopy.objects.filter(
            status=BookCopy.Status.AVAILABLE
        ).count(),
        "borrowed_copies": BookCopy.objects.filter(
            status=BookCopy.Status.ON_LOAN
        ).count(),
        "damaged_copies": BookCopy.objects.filter(
            status=BookCopy.Status.DAMAGED
        ).count(),
        "lost_copies": BookCopy.objects.filter(
            status=BookCopy.Status.LOST
        ).count(),
        "total_members": Member.objects.count(),
        "active_members": Member.objects.filter(
            status=Member.Status.ACTIVE
        ).count(),
        "active_loans": Loan.objects.filter(
            status=Loan.Status.ACTIVE
        ).count(),
        "overdue_loans": Loan.objects.filter(
            due_date__lt=today,
            status__in=[
                Loan.Status.ACTIVE,
                Loan.Status.OVERDUE,
            ],
        ).count(),
        "returned_loans": Loan.objects.filter(
            status=Loan.Status.RETURNED
        ).count(),
        "total_fines": Fine.objects.exclude(
            status=Fine.Status.WAIVED
        ).aggregate(total=Sum("amount"))["total"] or 0,
        "outstanding_fines": Fine.objects.exclude(
            status=Fine.Status.WAIVED
        ).aggregate(
            total=Sum(
                ExpressionWrapper(
                    F("amount") - F("amount_paid"),
                    output_field=DecimalField(
                        max_digits=12,
                        decimal_places=2,
                    ),
                )
            )
        )["total"] or 0,
    }


def inventory_report():
    """Summarize inventory by copy status and condition."""
    return {
        "by_status": list(
            BookCopy.objects.values("status").annotate(
                total=Count("id")
            ).order_by("status")
        ),
        "by_condition": list(
            BookCopy.objects.values("condition").annotate(
                total=Count("id")
            ).order_by("condition")
        ),
        "by_shelf": list(
            BookCopy.objects.values(
                "shelf__id",
                "shelf__name",
            ).annotate(
                total=Count("id")
            ).order_by("shelf__name")
        ),
    }


def membership_report():
    """Summarize readers by membership type and status."""
    return {
        "by_type": list(
            Member.objects.values("membership_type").annotate(
                total=Count("id")
            ).order_by("membership_type")
        ),
        "by_status": list(
            Member.objects.values("status").annotate(
                total=Count("id")
            ).order_by("status")
        ),
    }


def circulation_report(start_date=None, end_date=None):
    """Summarize loan activity within an optional date range."""
    loans = Loan.objects.all()

    if start_date:
        loans = loans.filter(issue_date__date__gte=start_date)

    if end_date:
        loans = loans.filter(issue_date__date__lte=end_date)

    return {
        "total_issues": loans.count(),
        "active": loans.filter(
            status=Loan.Status.ACTIVE
        ).count(),
        "overdue": loans.filter(
            Q(status=Loan.Status.OVERDUE)
            | Q(
                status=Loan.Status.ACTIVE,
                due_date__lt=timezone.localdate(),
            )
        ).count(),
        "returned": loans.filter(
            status=Loan.Status.RETURNED
        ).count(),
        "lost": loans.filter(
            status=Loan.Status.LOST
        ).count(),
    }


def popular_books_report(limit=10):
    """List the most frequently borrowed book titles."""
    return list(
        Book.objects.annotate(
            times_borrowed=Count("copies__loans")
        ).filter(
            times_borrowed__gt=0
        ).order_by(
            "-times_borrowed", "title"
        ).values(
            "id",
            "title",
            "times_borrowed",
        )[:limit]
    )


def overdue_loans_report():
    """Return currently overdue loans and their reader details."""
    today = timezone.localdate()

    return list(
        Loan.objects.filter(
            due_date__lt=today,
            status__in=[
                Loan.Status.ACTIVE,
                Loan.Status.OVERDUE,
            ],
        ).select_related(
            "member",
            "book_copy",
            "book_copy__book",
        ).annotate(
            days_overdue=F("due_date")
        ).order_by("due_date").values(
            "id",
            "member__membership_number",
            "member__first_name",
            "member__last_name",
            "book_copy__barcode",
            "book_copy__book__title",
            "issue_date",
            "due_date",
        )
    )


def fine_report(start_date=None, end_date=None):
    """Summarize fines and payments."""
    fines = Fine.objects.all()
    payments = FinePayment.objects.all()

    if start_date:
        fines = fines.filter(created_at__date__gte=start_date)
        payments = payments.filter(paid_at__date__gte=start_date)

    if end_date:
        fines = fines.filter(created_at__date__lte=end_date)
        payments = payments.filter(paid_at__date__lte=end_date)

    return {
        "fine_count": fines.count(),
        "fines_issued": fines.exclude(
            status=Fine.Status.WAIVED
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0,
        "amount_paid_toward_fines": payments.aggregate(
            total=Sum("amount")
        )["total"] or 0,
        "by_status": list(
            fines.values("status").annotate(
                total=Count("id"),
                amount=Sum("amount"),
            ).order_by("status")
        ),
        "by_type": list(
            fines.values("fine_type").annotate(
                total=Count("id"),
                amount=Sum("amount"),
            ).order_by("fine_type")
        ),
    }


def audit_report(start_date=None, end_date=None):
    """Summarize staff activity recorded in the audit log."""
    logs = AuditLog.objects.all()

    if start_date:
        logs = logs.filter(created_at__date__gte=start_date)

    if end_date:
        logs = logs.filter(created_at__date__lte=end_date)

    return {
        "total_actions": logs.count(),
        "by_action": list(
            logs.values("action").annotate(
                total=Count("id")
            ).order_by("action")
        ),
        "by_entity": list(
            logs.values("entity_type").annotate(
                total=Count("id")
            ).order_by("entity_type")
        ),
    }
