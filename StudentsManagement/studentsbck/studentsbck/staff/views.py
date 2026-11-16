
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound

from core.models import Staff

from staff.serializers import (
    StaffSerializer,
    StaffCreateSerializer,
)

from staff.selectors import (
    get_all_staff,
    get_staff_by_id,
    search_staff,
    get_staff_by_designation,
)

from staff.services import (
    create_staff,
    update_staff,
    delete_staff,
    activate_staff,
    deactivate_staff,
    update_staff_password,
)

from staff.permissions import (
    CanManageStaff,
    CanViewStaff,
)


class StaffListCreateView(APIView):

    def get_permissions(self):

        if self.request.method == "POST":
            return [CanManageStaff()]

        return [CanViewStaff()]

    def get(self, request):

        staff = get_all_staff()

        serializer = StaffSerializer(
            staff,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = StaffCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        staff = create_staff(
            **serializer.validated_data
        )

        return Response(
            StaffSerializer(staff).data,
            status=status.HTTP_201_CREATED
        )

class StaffDetailView(APIView):

    permission_classes = [CanManageStaff]

    def get_object(self, staff_id):

        staff = get_staff_by_id(staff_id)

        if not staff:
            raise NotFound("Staff member not found.")

        return staff

    def get(self, request, staff_id):

        staff = self.get_object(staff_id)

        return Response(
            StaffSerializer(staff).data
        )

    def patch(self, request, staff_id):

        staff = self.get_object(staff_id)

        serializer = StaffSerializer(
            staff,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        staff = update_staff(
            staff,
            **{
                key: value
                for key, value in serializer.validated_data.items()
                if key not in ["user"]
            }
        )

        return Response(
            StaffSerializer(staff).data
        )

    def delete(self, request, staff_id):

        staff = self.get_object(staff_id)

        delete_staff(staff)

        return Response(
            {"message": "Staff deleted successfully."},
            status=status.HTTP_200_OK
        )

class StaffStatusView(APIView):

    permission_classes = [CanManageStaff]

    def patch(self, request, staff_id):

        staff = get_staff_by_id(staff_id)

        if not staff:
            raise NotFound("Staff member not found.")

        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"error": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if is_active:
            activate_staff(staff)
        else:
            deactivate_staff(staff)

        return Response({
            "message": "Staff account status updated.",
            "is_active": staff.user.is_active
        })

class StaffSearchView(APIView):

    permission_classes = [CanViewStaff]

    def get(self, request):

        query = request.query_params.get(
            "search", ""
        )

        designation = request.query_params.get(
            "designation"
        )

        if designation:
            staff = get_staff_by_designation(
                designation
            )

        elif query:
            staff = search_staff(query)

        else:
            staff = get_all_staff()

        serializer = StaffSerializer(
            staff,
            many=True
        )

        return Response(serializer.data)
