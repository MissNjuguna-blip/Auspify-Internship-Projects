
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound

from core.models import FeeCategory, Student

from finance.serializers import (
    FeeCategorySerializer,
    FeePaymentSerializer,
)

from finance.selectors import (
    get_all_fee_categories,
    get_all_payments,
    get_student_payments,
    get_payment_by_id,
)

from finance.services import (
    create_fee_category,
    update_fee_category,
    delete_fee_category,
    record_student_payment,
)

from finance.permissions import (
    CanManageFinance,
    CanViewFinance,
)


class FeeCategoryListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [CanManageFinance()]

        return [CanViewFinance()]

    def get(self, request):

        categories = get_all_fee_categories()

        serializer = FeeCategorySerializer(
            categories,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = FeeCategorySerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        category = create_fee_category(
            **serializer.validated_data
        )

        return Response(
            FeeCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )


class FeeCategoryDetailView(APIView):

    permission_classes = [CanManageFinance]

    def get_object(self, category_id):

        category = FeeCategory.objects.filter(
            id=category_id
        ).first()

        if not category:
            raise NotFound("Fee category not found.")

        return category

    def patch(self, request, category_id):

        category = self.get_object(category_id)

        serializer = FeeCategorySerializer(
            category,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        category = update_fee_category(
            category,
            **serializer.validated_data,
        )

        return Response(
            FeeCategorySerializer(category).data
        )

    def delete(self, request, category_id):

        category = self.get_object(category_id)

        delete_fee_category(category)

        return Response(
            {"message": "Fee category deleted successfully."}
        )
# Payment

class FeePaymentListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [CanManageFinance()]

        return [CanViewFinance()]

    def get(self, request):

        payments = get_all_payments()

        serializer = FeePaymentSerializer(
            payments,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = FeePaymentSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        payment = record_student_payment(
            **serializer.validated_data
        )

        return Response(
            FeePaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class StudentPaymentHistoryView(APIView):

    permission_classes = [CanViewFinance]

    def get(self, request, student_id):

        student = Student.objects.filter(
            id=student_id
        ).first()

        if not student:
            raise NotFound("Student not found.")

        payments = get_student_payments(student)

        serializer = FeePaymentSerializer(
            payments,
            many=True,
        )

        return Response(serializer.data)

from .utils import (
    calculate_total_collections,
    calculate_daily_collections,
    calculate_student_total_payments,
)


class FinanceSummaryView(APIView):

    permission_classes = [CanViewFinance]

    def get(self, request):

        return Response({
            "total_collections": calculate_total_collections(),
            "total_payments": get_all_payments().count(),
        })


class DailyCollectionView(APIView):

    permission_classes = [CanViewFinance]

    def get(self, request):

        date = request.query_params.get("date")

        if not date:
            return Response(
                {"error": "Date parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from datetime import date as Date
        from django.utils.dateparse import parse_date

        parsed_date = parse_date(date)

        if not parsed_date:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = calculate_daily_collections(
            parsed_date
        )

        return Response({
            "date": parsed_date,
            "total_collections": total,
        })
