
from decimal import Decimal

from django.db.models import Sum

from core.models import FeePayment


def calculate_student_total_payments(student):

    return FeePayment.objects.filter(
        student=student
    ).aggregate(
        total=Sum("amount")
    )["total"] or 0

def calculate_total_collections():

    return FeePayment.objects.aggregate(
        total=Sum("amount")
    )["total"] or 0

def calculate_daily_collections(date):

    return FeePayment.objects.filter(
        payment_date=date
    ).aggregate(
        total=Sum("amount")
    )["total"] or 0

from django.db.models.functions import TruncMonth


def calculate_monthly_collections():

    return (
        FeePayment.objects
        .annotate(month=TruncMonth("payment_date"))
        .values("month")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )

def calculate_student_balance(student, total_fees):

    total_paid = calculate_student_total_payments(
        student
    )

    balance = Decimal(str(total_fees)) - Decimal(str(total_paid))

    return {
        "total_fees": total_fees,
        "total_paid": total_paid,
        "balance": balance,
        "status": (
            "paid" if balance <= 0 else "outstanding"
        ),
    }
