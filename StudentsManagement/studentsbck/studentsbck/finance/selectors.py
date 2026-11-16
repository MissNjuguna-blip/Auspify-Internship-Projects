
from django.db.models import Sum

from core.models import (
    FeeCategory,
    FeePayment,
    Student,
)


def get_all_fee_categories():
    return FeeCategory.objects.all().order_by("name")


def get_fee_category_by_id(category_id):
    return FeeCategory.objects.filter(
        id=category_id
    ).first()


def get_all_payments():
    return FeePayment.objects.select_related(
        "student"
    ).order_by("-payment_date")


def get_payment_by_id(payment_id):
    return FeePayment.objects.filter(
        id=payment_id
    ).select_related("student").first()


def get_student_payments(student):
    return FeePayment.objects.filter(
        student=student
    ).order_by("-payment_date")


def get_payments_by_date(start_date, end_date):
    return FeePayment.objects.filter(
        payment_date__range=(start_date, end_date)
    ).select_related("student")


def get_payments_by_student(student_id):
    return FeePayment.objects.filter(
        student_id=student_id
    ).select_related("student").order_by("-payment_date")


def get_total_collections():
    return FeePayment.objects.aggregate(
        total=Sum("amount")
    )["total"] or 0


def get_total_student_payments(student):
    return FeePayment.objects.filter(
        student=student
    ).aggregate(
        total=Sum("amount")
    )["total"] or 0
