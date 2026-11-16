
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound

from core.models import (
    Student,
    Guardian,
    StudentGuardian,
    ClassRoom,
    AcademicYear,
)

from students.serializers import (
    StudentSerializer,
    GuardianSerializer,
    StudentGuardianSerializer,
    EnrollmentSerializer,
)

from students.selectors import (
    get_all_students,
    get_student_by_id,
    search_students,
    get_student_guardians,
    get_student_enrollments,
)

from students.services import (
    register_student,
    update_student,
    delete_student,
    create_guardian,
    assign_guardian,
    remove_guardian,
    enroll_student,
)

from students.permissions import (
    CanManageStudents,
    CanViewStudents,
)


# =====================================================
# STUDENTS
# =====================================================

class StudentListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [CanManageStudents()]

        return [CanViewStudents()]

    def get(self, request):

        students = get_all_students()

        serializer = StudentSerializer(
            students,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = StudentSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        student = register_student(
            **serializer.validated_data
        )

        return Response(
            StudentSerializer(student).data,
            status=status.HTTP_201_CREATED
        )


# =====================================================
# STUDENT DETAILS
# =====================================================

class StudentDetailView(APIView):

    permission_classes = [CanManageStudents]

    def get_object(self, student_id):

        student = get_student_by_id(student_id)

        if not student:
            raise NotFound("Student not found.")

        return student

    def get(self, request, student_id):

        student = self.get_object(student_id)

        return Response(
            StudentSerializer(student).data
        )

    def patch(self, request, student_id):

        student = self.get_object(student_id)

        serializer = StudentSerializer(
            student,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        student = update_student(
            student,
            **serializer.validated_data
        )

        return Response(
            StudentSerializer(student).data
        )

    def delete(self, request, student_id):

        student = self.get_object(student_id)

        delete_student(student)

        return Response({
            "message": "Student deleted successfully."
        })


# =====================================================
# STUDENT SEARCH
# =====================================================

class StudentSearchView(APIView):

    permission_classes = [CanViewStudents]

    def get(self, request):

        query = request.query_params.get(
            "search", ""
        ).strip()

        if not query:
            return Response(
                {"error": "Search query is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        students = search_students(query)

        serializer = StudentSerializer(
            students.distinct(),
            many=True
        )

        return Response(serializer.data)


# =====================================================
# GUARDIANS
# =====================================================

class GuardianListCreateView(APIView):

    permission_classes = [CanManageStudents]

    def get(self, request):

        from students.selectors import get_all_guardians

        guardians = get_all_guardians()

        serializer = GuardianSerializer(
            guardians,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = GuardianSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        guardian = create_guardian(
            **serializer.validated_data
        )

        return Response(
            GuardianSerializer(guardian).data,
            status=status.HTTP_201_CREATED
        )


# =====================================================
# STUDENT-GUARDIAN RELATIONSHIPS
# =====================================================

class StudentGuardianView(APIView):

    permission_classes = [CanManageStudents]

    def post(self, request, student_id):

        student = get_student_by_id(student_id)

        if not student:
            raise NotFound("Student not found.")

        guardian_id = request.data.get("guardian")

        if not guardian_id:
            return Response(
                {"error": "Guardian ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        guardian = Guardian.objects.filter(
            id=guardian_id
        ).first()

        if not guardian:
            raise NotFound("Guardian not found.")

        is_primary = request.data.get(
            "is_primary", False
        )

        if not isinstance(is_primary, bool):
            return Response(
                {"error": "is_primary must be true or false."},
                status=status.HTTP_400_BAD_REQUEST
            )

        relationship = assign_guardian(
            student,
            guardian,
            is_primary
        )

        return Response(
            StudentGuardianSerializer(
                relationship
            ).data,
            status=status.HTTP_201_CREATED
        )

    def get(self, request, student_id):

        student = get_student_by_id(student_id)

        if not student:
            raise NotFound("Student not found.")

        guardians = get_student_guardians(student)

        serializer = StudentGuardianSerializer(
            guardians,
            many=True
        )

        return Response(serializer.data)

    def delete(self, request, student_id):

        student = get_student_by_id(student_id)

        if not student:
            raise NotFound("Student not found.")

        guardian_id = request.data.get("guardian")

        if not guardian_id:
            return Response(
                {"error": "Guardian ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        relationship = StudentGuardian.objects.filter(
            student=student,
            guardian_id=guardian_id
        ).first()

        if not relationship:
            raise NotFound(
                "Guardian relationship not found."
            )

        remove_guardian(
            student,
            relationship.guardian
        )

        return Response(
            {
                "message": "Guardian relationship removed successfully."
            },
            status=status.HTTP_200_OK
        )


# =====================================================
# STUDENT ENROLLMENT
# =====================================================

class StudentEnrollmentView(APIView):

    permission_classes = [CanManageStudents]

    def get(self, request, student_id):

        student = get_student_by_id(student_id)

        if not student:
            raise NotFound("Student not found.")

        enrollments = get_student_enrollments(student)

        serializer = EnrollmentSerializer(
            enrollments,
            many=True
        )

        return Response(serializer.data)

    def post(self, request, student_id):

        student = get_student_by_id(student_id)

        if not student:
            raise NotFound("Student not found.")

        classroom = ClassRoom.objects.filter(
            id=request.data.get("classroom")
        ).first()

        academic_year = AcademicYear.objects.filter(
            id=request.data.get("academic_year")
        ).first()

        if not classroom or not academic_year:
            return Response(
                {
                    "error": "Invalid classroom or academic year."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment = enroll_student(
            student,
            classroom,
            academic_year
        )

        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED
        )
