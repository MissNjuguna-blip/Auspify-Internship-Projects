
from django.urls import path

from examinations.views import (
    ExaminationListCreateView,
    ExaminationResultsView,
    StudentResultCreateView,
    ClassroomResultsView,
)


urlpatterns = [

    path(
        "",
        ExaminationListCreateView.as_view(),
        name="examination-list-create",
    ),

    path(
        "<int:examination_id>/results/",
        ExaminationResultsView.as_view(),
        name="examination-results",
    ),

    path(
        "results/create/",
        StudentResultCreateView.as_view(),
        name="student-result-create",
    ),

    path(
        "results/classroom/",
        ClassroomResultsView.as_view(),
        name="classroom-results",
    ),

]
