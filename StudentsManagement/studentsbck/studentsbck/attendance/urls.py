
from django.urls import path

from .views import (
    ClassroomAttendanceView,
    DailyAttendanceView,
    AttendanceUpdateView,
)


urlpatterns = [
    path(
        "classroom/",
        ClassroomAttendanceView.as_view(),
        name="classroom-attendance",
    ),

    path(
        "daily/",
        DailyAttendanceView.as_view(),
        name="daily-attendance",
    ),

    path(
        "update/",
        AttendanceUpdateView.as_view(),
        name="update-attendance",
    ),
]
