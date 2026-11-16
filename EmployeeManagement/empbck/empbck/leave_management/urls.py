from django.urls import path
from . import views
app_name = "leave"
urlpatterns = [
    # =====================================================
    # LEAVE TYPE MANAGEMENT
    # =====================================================
    path("types/",views.leave_type_list_create,name="type_list_create"),
    path("types/<uuid:pk>/", views.leave_type_detail,name="type_detail"),
    # =====================================================
    # LEAVE REQUEST MANAGEMENT
    # =====================================================
    path("requests/",views.leave_request_list_create,name="request_list_create"),
    path("requests/<uuid:pk>/", views.leave_request_detail, name="request_detail"),
    # =====================================================
    # APPROVAL WORKFLOW
    # =====================================================
    path("requests/<uuid:pk>/approve/",views.approve_leave_request, name="approve"),
    path("requests/<uuid:pk>/reject/", views.reject_leave_request, name="reject"),
    path( "requests/<uuid:pk>/cancel/", views.cancel_leave_request,name="cancel"),
    # =====================================================
    # LEAVE BALANCE MANAGEMENT
    # =====================================================
    path("balances/", views.leave_balance_list_create,name="balance_list_create"),
    path("balances/<uuid:pk>/", views.leave_balance_detail, name="balance_detail"),
    path( "balances/employee/<uuid:employee_id>/", views.employee_leave_summary, name="employee_summary"),
    # =====================================================
    # DASHBOARD AND REPORTS
    # =====================================================
    path( "dashboard/", views.leave_dashboard_summary, name="dashboard"),
    path( "report/", views.leave_report, name="report"),
]
