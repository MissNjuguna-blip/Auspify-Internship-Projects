
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound

from core.models import (
    Examination,
    Student,
    Subject,
    ClassRoom,
)

from examinations.serializers import (
    ExaminationSerializer,
    StudentResultSerializer,
    ClassroomResultsSerializer,
)

from examinations.selectors import (
    get_all_examinations,
    get_examination_results,
)

from examinations.services import (
    create_examination,
    enter_student_result,
    enter_classroom_results,
)

from examinations.permissions import (
    CanManageExaminations,
    CanViewExaminations,
)


class ExaminationListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [CanManageExaminations()]

        return [CanViewExaminations()]

    def get(self, request):

        examinations = get_all_examinations()

        serializer = ExaminationSerializer(
            examinations,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = ExaminationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        examination = create_examination(
            **serializer.validated_data
        )

        return Response(
            ExaminationSerializer(examination).data,
            status=status.HTTP_201_CREATED,
        )


class ExaminationResultsView(APIView):

    permission_classes = [CanViewExaminations]

    def get(self, request, examination_id):

        examination = Examination.objects.filter(
            id=examination_id
        ).first()

        if not examination:
            raise NotFound("Examination not found.")

        results = get_examination_results(examination)

        serializer = StudentResultSerializer(
            results,
            many=True,
        )

        return Response(serializer.data)


class StudentResultCreateView(APIView):

    permission_classes = [CanManageExaminations]

    def post(self, request):

        serializer = StudentResultSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        result = enter_student_result(
            **serializer.validated_data
        )

        return Response(
            StudentResultSerializer(result).data,
            status=status.HTTP_201_CREATED,
        )


class ClassroomResultsView(APIView):

    permission_classes = [CanManageExaminations]

    def post(self, request):

        serializer = ClassroomResultsSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        results_data = {
            item["student_id"]: item["marks"]
            for item in data["results"]
        }

        results = enter_classroom_results(
            classroom=ClassRoom.objects.get(
                pk=data["classroom"]
            ),
            examination=Examination.objects.get(
                pk=data["examination"]
            ),
            subject=Subject.objects.get(
                pk=data["subject"]
            ),
            results_data=results_data,
        )

        return Response(
            StudentResultSerializer(
                results,
                many=True,
            ).data,
            status=status.HTTP_201_CREATED,
        )
