
from django.urls import path
from audit.views import (
    AuditLogListView,
    AuditLogDetailView,
    AuditSummaryView,
)

urlpatterns = [
    path(
        "logs/",
        AuditLogListView.as_view(),
        name="audit-log-list",
    ),
    path(
        "logs/<int:pk>/",
        AuditLogDetailView.as_view(),
        name="audit-log-detail",
    ),
    path(
        "summary/",
        AuditSummaryView.as_view(),
        name="audit-summary",
    ),
]
