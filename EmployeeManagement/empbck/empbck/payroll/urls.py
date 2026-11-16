from django.urls import path

from . import views

app_name = "payroll"

urlpatterns = [
    # ---------------- SALARY STRUCTURES ----------------
    path("salary-structures/", views.structure_list_create, name="structure_list_create"),
    path("salary-structures/<uuid:pk>/", views.structure_detail, name="structure_detail"),

    # ---------------- PAYROLL RUNS / REPORTS ----------------
    path("generate/", views.generate_payroll, name="generate"),
    path("bulk-action/", views.bulk_payroll_action, name="bulk_action"),
    path("summary/", views.payroll_summary, name="summary"),

    # ---------------- PAYROLL RECORDS ----------------
    path("", views.payroll_list, name="list"),
    path("<uuid:pk>/", views.payroll_detail, name="detail"),
    path("<uuid:pk>/process/", views.process_payroll, name="process"),
    path("<uuid:pk>/pay/", views.pay_payroll, name="pay"),
    path("<uuid:pk>/cancel/", views.cancel_payroll, name="cancel"),
    path("<uuid:pk>/payslip/", views.payslip, name="payslip"),
]