
from django.urls import path

from staff.views import (
    StaffListCreateView,
    StaffDetailView,
    StaffStatusView,
    StaffSearchView,
)


urlpatterns = [

    path(
        "",
        StaffListCreateView.as_view(),
        name="staff-list-create"
    ),

    path(
        "search/",
        StaffSearchView.as_view(),
        name="staff-search"
    ),

    path(
        "<int:staff_id>/",
        StaffDetailView.as_view(),
        name="staff-detail"
    ),

    path(
        "<int:staff_id>/status/",
        StaffStatusView.as_view(),
        name="staff-status"
    ),

]
