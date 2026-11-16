from django.urls import path

from students.views import (
    StudentListCreateView,
    StudentDetailView,
    StudentSearchView,
    GuardianListCreateView,
    StudentGuardianView,
    StudentEnrollmentView,
)

urlpatterns = [
    path("", StudentListCreateView.as_view()),
    path("search/", StudentSearchView.as_view()),
    path("<int:student_id>/", StudentDetailView.as_view()),

    path("guardians/", GuardianListCreateView.as_view()),

    path(
        "<int:student_id>/guardians/",
        StudentGuardianView.as_view()
    ),

    path(
        "<int:student_id>/enrollments/",
        StudentEnrollmentView.as_view()
    ),
]