from django.urls import path

from . import views

app_name = "department"

urlpatterns = [
    # ---------------- DEPARTMENT REPORTS ----------------
    path("stats/", views.department_stats, name="stats"),

    # ---------------- DEPARTMENTS ----------------
    path("", views.department_list_create, name="list_create"),
    path("<uuid:pk>/", views.department_detail, name="detail"),
    path("<uuid:pk>/employees/", views.department_employees, name="employees"),
]