
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Fine, FinePayment, Loan
from .serializers import (
    FineSerializer,
    FinePaymentSerializer,
    PaymentCreateSerializer,
    OverdueLoanSerializer,
)
from .services import (
    process_overdue_loans,
    record_fine_payment,
)


class FineDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()

        overdue_loans = Loan.objects.filter(
            due_date__lt=today,
            status=Loan.Status.OVERDUE,
        ).count()

        active_loans = Loan.objects.filter(
            status=Loan.Status.ACTIVE,
        ).count()

        outstanding_fines = Fine.objects.filter(
            status__in=[
                Fine.Status.UNPAID,
                Fine.Status.PARTIAL,
            ],
        ).aggregate(
            total=Sum("amount") - Sum("amount_paid")
        )["total"] or Decimal("0.00")

        payments = FinePayment.objects.filter(
            paid_at__date=today,
        ).aggregate(
            total=Sum("amount"),
        )["total"] or Decimal("0.00")

        return Response({
            "overdue_loans": overdue_loans,
            "active_loans": active_loans,
            "outstanding_fines": outstanding_fines,
            "payments_collected_today": payments,
        })


class OverdueLoanListView(generics.ListAPIView):
    serializer_class = OverdueLoanSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Loan.objects.filter(
            status=Loan.Status.OVERDUE,
        ).select_related(
            "member",
            "book_copy__book",
        )

        membership_number = self.request.query_params.get(
            "membership_number"
        )
        if membership_number:
            queryset = queryset.filter(
                member__membership_number=membership_number
            )

        return queryset.order_by("due_date")


class FineListView(generics.ListAPIView):
    serializer_class = FineSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Fine.objects.select_related(
            "loan__member",
            "loan__book_copy__book",
        )

        fine_status = self.request.query_params.get("status")
        fine_type = self.request.query_params.get("fine_type")
        membership_number = self.request.query_params.get(
            "membership_number"
        )

        if fine_status:
            queryset = queryset.filter(status=fine_status)

        if fine_type:
            queryset = queryset.filter(fine_type=fine_type)

        if membership_number:
            queryset = queryset.filter(
                loan__member__membership_number=membership_number
            )

        return queryset


class FinePaymentListView(generics.ListAPIView):
    serializer_class = FinePaymentSerializer
    permission_classes = [IsAdminUser]
    queryset = FinePayment.objects.select_related(
        "fine",
        "received_by",
    ).order_by("-paid_at")


class RecordFinePaymentView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            payment = record_fine_payment(
                fine_id=data["fine_id"],
                amount=data["amount"],
                payment_method=data["payment_method"],
                received_by=request.user,
                transaction_reference=data.get(
                    "transaction_reference", ""
                ),
                notes=data.get("notes", ""),
            )
        except Fine.DoesNotExist:
            return Response(
                {"detail": "Fine not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            FinePaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class ProcessOverdueLoansView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        result = process_overdue_loans()

        return Response({
            "detail": "Overdue processing completed.",
            "date": result["date"],
            "loans_marked_overdue": result[
                "loans_marked_overdue"
            ],
        })
