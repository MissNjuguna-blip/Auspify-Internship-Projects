from django.urls import path
from reports.views import (
    DashboardReportView,
    InventoryReportView,
    MembershipReportView,
    CirculationReportView,
    PopularBooksReportView,
    OverdueLoansReportView,
    FineReportView,
    AuditReportView,
)
app_name = "reports"

urlpatterns = [
    path("dashboard/", DashboardReportView.as_view(), name="dashboard"),
    path("inventory/", InventoryReportView.as_view(), name="inventory"),
    path("members/", MembershipReportView.as_view(), name="members"),
    path("circulation/", CirculationReportView.as_view(), name="circulation"),
    path("popular-books/", PopularBooksReportView.as_view(), name="popular-books"),
    path("overdue/", OverdueLoansReportView.as_view(), name="overdue"),
    path("fines/", FineReportView.as_view(), name="fines"),
    path("audit/", AuditReportView.as_view(), name="audit"),
]
