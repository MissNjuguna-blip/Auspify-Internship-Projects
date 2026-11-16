from django.urls import path
from .import views
app_name = "attendance"

urlpatterns = [
    # ---------------- ACTIONS / REPORTS ----------------
    path("check-in/", views.check_in, name="check_in"),
    path("check-out/", views.check_out, name="check_out"),
    path("bulk/", views.bulk_mark_attendance, name="bulk_mark"),
    path("summary/", views.attendance_summary, name="summary"),
    path("report/", views.attendance_report, name="report"),

    # ---------------- CRUD ----------------
    path("", views.attendance_list_create, name="list_create"),
    path("<uuid:pk>/", views.attendance_detail, name="detail"),
]