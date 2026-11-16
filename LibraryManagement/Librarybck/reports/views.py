from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from reports.serializers import (
    ReportDateFilterSerializer,
    PopularBooksFilterSerializer,
)
from reports import services


class BaseReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get_date_filters(self, request):
        serializer = ReportDateFilterSerializer(
            data=request.query_params
        )
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data


class DashboardReportView(BaseReportView):
    def get(self, request):
        return Response(services.dashboard_report())


class InventoryReportView(BaseReportView):
    def get(self, request):
        return Response(services.inventory_report())


class MembershipReportView(BaseReportView):
    def get(self, request):
        return Response(services.membership_report())


class CirculationReportView(BaseReportView):
    def get(self, request):
        filters = self.get_date_filters(request)
        return Response(
            services.circulation_report(**filters)
        )


class PopularBooksReportView(BaseReportView):
    def get(self, request):
        serializer = PopularBooksFilterSerializer(
            data=request.query_params
        )
        serializer.is_valid(raise_exception=True)

        return Response(
            services.popular_books_report(
                limit=serializer.validated_data["limit"]
            )
        )


class OverdueLoansReportView(BaseReportView):
    def get(self, request):
        return Response(services.overdue_loans_report())


class FineReportView(BaseReportView):
    def get(self, request):
        filters = self.get_date_filters(request)
        return Response(services.fine_report(**filters))


class AuditReportView(BaseReportView):
    def get(self, request):
        filters = self.get_date_filters(request)
        return Response(services.audit_report(**filters))
