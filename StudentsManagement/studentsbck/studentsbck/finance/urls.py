
from django.urls import path

from finance.views import (
    FeeCategoryListCreateView,
    FeeCategoryDetailView,
    FeePaymentListCreateView,
    StudentPaymentHistoryView,
    FinanceSummaryView,
    DailyCollectionView,
)


urlpatterns = [

    # Fee categories
    path(
        "categories/",
        FeeCategoryListCreateView.as_view(),
        name="fee-category-list-create",
    ),

    path(
        "categories/<int:category_id>/",
        FeeCategoryDetailView.as_view(),
        name="fee-category-detail",
    ),

    # Payments
    path(
        "payments/",
        FeePaymentListCreateView.as_view(),
        name="payment-list-create",
    ),

    path(
        "students/<int:student_id>/payments/",
        StudentPaymentHistoryView.as_view(),
        name="student-payment-history",
    ),

    # Reports
    path(
        "summary/",
        FinanceSummaryView.as_view(),
        name="finance-summary",
    ),

    path(
        "collections/daily/",
        DailyCollectionView.as_view(),
        name="daily-collections",
    ),

]
