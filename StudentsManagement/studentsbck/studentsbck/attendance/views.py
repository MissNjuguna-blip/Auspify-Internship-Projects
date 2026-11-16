
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

from core.models import StudentAttendance

from attendance.serializers import (
    StudentAttendanceSerializer,
    ClassroomAttendanceSerializer,
    AttendanceUpdateSerializer,
)

from attendance.services import (
    mark_classroom_attendance,
    update_student_attendance,
)

from attendance.selectors import (
    get_daily_attendance,
    get_classroom_students,
)


class ClassroomAttendanceView(APIView):

    def post(self, request):

        serializer = ClassroomAttendanceSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        attendance_data = {
            item["student_id"]: item["status"]
            for item in data["attendance"]
        }

        try:
            mark_classroom_attendance(
                classroom=data["classroom"],
                academic_year=data["academic_year"],
                attendance_date=data["date"],
                attendance_data=attendance_data,
            )

            return Response(
                {"message": "Attendance recorded successfully."},
                status=status.HTTP_201_CREATED,
            )

        except Exception as exc:
            raise ValidationError(str(exc))


class DailyAttendanceView(APIView):

    def get(self, request):

        classroom_id = request.query_params.get("classroom")
        academic_year_id = request.query_params.get("academic_year")
        attendance_date = request.query_params.get("date")

        if not all([
            classroom_id,
            academic_year_id,
            attendance_date,
        ]):
            return Response(
                {"error": "Classroom, academic year and date are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from core.models import ClassRoom, AcademicYear

        classroom = ClassRoom.objects.get(pk=classroom_id)
        academic_year = AcademicYear.objects.get(pk=academic_year_id)

        records = get_daily_attendance(
            classroom,
            academic_year,
            attendance_date,
        )

        serializer = StudentAttendanceSerializer(
            records,
            many=True,
        )

        return Response(serializer.data)


class AttendanceUpdateView(APIView):

    def patch(self, request):

        serializer = AttendanceUpdateSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        attendance = update_student_attendance(
            student=data["student"],
            attendance_date=data["date"],
            status=data["status"],
            remarks=data.get("remarks", ""),
        )

        return Response(
            StudentAttendanceSerializer(attendance).data
        )
