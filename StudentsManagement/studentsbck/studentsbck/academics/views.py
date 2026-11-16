
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from core.models import (
    AcademicYear,
    Term,
    ClassRoom,
    Subject,
    Enrollment,
)

from academics.serializers import (
    AcademicYearSerializer,
    TermSerializer,
    ClassRoomSerializer,
    SubjectSerializer,
    EnrollmentSerializer,
)

from academics.services import activate_academic_year


# ============================================================
# ACADEMIC YEAR VIEWS
# ============================================================

class AcademicYearViewSet(viewsets.ModelViewSet):

    queryset = AcademicYear.objects.all().order_by("-start_date")

    serializer_class = AcademicYearSerializer

    permission_classes = [IsAdminUser]

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):

        academic_year = self.get_object()

        try:
            academic_year = activate_academic_year(academic_year)

        except DjangoValidationError as error:
            raise ValidationError(error.messages)

        return Response(
            {
                "message": "Academic year activated successfully.",
                "academic_year": AcademicYearSerializer(
                    academic_year
                ).data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# TERM VIEWS
# ============================================================

class TermViewSet(viewsets.ModelViewSet):

    queryset = Term.objects.select_related(
        "academic_year"
    ).all().order_by("start_date")

    serializer_class = TermSerializer

    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        return queryset


# ============================================================
# CLASSROOM VIEWS
# ============================================================

class ClassRoomViewSet(viewsets.ModelViewSet):

    queryset = ClassRoom.objects.all().order_by("name")

    serializer_class = ClassRoomSerializer

    permission_classes = [IsAdminUser]


# ============================================================
# SUBJECT VIEWS
# ============================================================

class SubjectViewSet(viewsets.ModelViewSet):

    queryset = Subject.objects.all().order_by("name")

    serializer_class = SubjectSerializer

    permission_classes = [IsAdminUser]


# ============================================================
# ENROLLMENT VIEWS
# ============================================================

class EnrollmentViewSet(viewsets.ModelViewSet):

    queryset = Enrollment.objects.select_related(
        "student",
        "classroom",
        "academic_year",
    ).all().order_by("-enrollment_date")

    serializer_class = EnrollmentSerializer

    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        classroom = self.request.query_params.get(
            "classroom"
        )

        student = self.request.query_params.get(
            "student"
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if classroom:
            queryset = queryset.filter(
                classroom_id=classroom
            )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        return queryset
