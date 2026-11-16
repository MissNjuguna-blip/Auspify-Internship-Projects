
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated

from core.models import School

from administration.serializers import SchoolSerializer
from administration.permissions import IsSystemAdmin
from administration.services import get_admin_dashboard


# ============================================================
# SCHOOL MANAGEMENT
# ============================================================

class SchoolViewSet(viewsets.ModelViewSet):
    """
    Create, retrieve, update and delete school records.
    """

    queryset = School.objects.all().order_by("name")

    serializer_class = SchoolSerializer

    permission_classes = [IsSystemAdmin]


# ============================================================
# ADMIN DASHBOARD
# ============================================================

class AdminDashboardView(APIView):
    """
    Retrieve overall system statistics.
    """

    permission_classes = [IsSystemAdmin]

    def get(self, request):

        dashboard_data = get_admin_dashboard()

        return Response(dashboard_data)
