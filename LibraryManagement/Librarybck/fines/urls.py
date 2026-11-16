
from django.urls import path

from fines.views import (
    FineDashboardView,
    OverdueLoanListView,
    FineListView,
    FinePaymentListView,
    RecordFinePaymentView,
    ProcessOverdueLoansView,
)

urlpatterns = [
    path(
        "dashboard/",
        FineDashboardView.as_view(),
        name="fines-dashboard",
    ),
    path(
        "overdue/",
        OverdueLoanListView.as_view(),
        name="overdue-loans",
    ),
    path(
        "list/",
        FineListView.as_view(),
        name="fine-list",
    ),
    path(
        "payments/",
        FinePaymentListView.as_view(),
        name="fine-payment-list",
    ),
    path(
        "payments/record/",
        RecordFinePaymentView.as_view(),
        name="record-fine-payment",
    ),
    path(
        "process-overdue/",
        ProcessOverdueLoansView.as_view(),
        name="process-overdue-loans",
    ),
]
