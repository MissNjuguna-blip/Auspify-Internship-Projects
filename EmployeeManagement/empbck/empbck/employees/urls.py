from django.urls import path

from . import views

app_name = "employee"

urlpatterns = [
    # ---------------- REPORTS ----------------
    path("stats/", views.employee_stats, name="stats"),

    # ---------------- EMPLOYEES ----------------
    path("", views.employee_list_create, name="list_create"),
    path("<uuid:pk>/", views.employee_detail, name="detail"),
    path("<uuid:pk>/terminate/", views.terminate_employee, name="terminate"),
    path("<uuid:pk>/reactivate/", views.reactivate_employee, name="reactivate"),

    # ---------------- EMERGENCY CONTACTS ----------------
    path("<uuid:pk>/emergency-contacts/", views.contact_list_create, name="contact_list_create"),
    path(
        "<uuid:pk>/emergency-contacts/<uuid:contact_id>/",
        views.contact_detail,
        name="contact_detail",
    ),

    # ---------------- DOCUMENTS ----------------
    path("<uuid:pk>/documents/", views.document_list_create, name="document_list_create"),
    path(
        "<uuid:pk>/documents/<uuid:document_id>/",
        views.document_detail,
        name="document_detail",
    ),
]