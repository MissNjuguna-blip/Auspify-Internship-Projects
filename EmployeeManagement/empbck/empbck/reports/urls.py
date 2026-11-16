from django.urls import path

from . import views

app_name = "reports"

urlpatterns = [
    path("", views.report_catalogue, name="catalogue"),

    # ---------------- EMPLOYEES ----------------
    path("employees/headcount/", views.headcount, name="headcount"),
    path("employees/turnover/", views.turnover, name="turnover"),
    path("employees/upcoming-events/", views.upcoming_events, name="upcoming-events"),

    # ---------------- ATTENDANCE ----------------
    path("attendance/", views.attendance, name="attendance"),

    # ---------------- LEAVE ----------------
    path("leave/", views.leave, name="leave"),
    path("leave/balances/", views.leave_balances, name="leave-balances"),

    # ---------------- PAYROLL ----------------
    path("payroll/cost/", views.payroll_cost, name="payroll-cost"),

    # ---------------- AUDIT ----------------
    path("audit/", views.audit, name="audit"),
]