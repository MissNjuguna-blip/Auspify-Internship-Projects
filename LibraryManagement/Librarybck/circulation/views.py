
from django.db.models import Count, Q
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from core.models import BookCopy, Loan, Member, LoanRenewal
from circulation.permissions import IsCirculationStaff
from circulation.serializers import (
    IssueLoanSerializer,
    LoanSerializer,
    RenewLoanSerializer,
    ReturnLoanSerializer,
    LoanRenewalSerializer,
)
from circulation.services import (
    issue_book,
    return_book,
    renew_loan,
    refresh_overdue_loans,
)


class LoanListView(generics.ListAPIView):
    """
    GET /api/circulation/loans/

    Supports filtering by status, member, book copy, and due dates.
    """

    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def get_queryset(self):
        queryset = Loan.objects.select_related(
            "member",
            "book_copy",
            "book_copy__book",
            "issued_by",
            "returned_to",
        ).prefetch_related("renewals__renewed_by")

        params = self.request.query_params

        loan_status = params.get("status")
        member_id = params.get("member")
        book_copy_id = params.get("book_copy")
        due_from = params.get("due_from")
        due_to = params.get("due_to")
        search = params.get("search")

        valid_statuses = Loan.Status.values

        if loan_status:
            if loan_status not in valid_statuses:
                raise ValidationError({
                    "status": "Invalid loan status."
                })
            queryset = queryset.filter(status=loan_status)

        if member_id:
            queryset = queryset.filter(member_id=member_id)

        if book_copy_id:
            queryset = queryset.filter(book_copy_id=book_copy_id)

        if due_from:
            queryset = queryset.filter(due_date__gte=due_from)

        if due_to:
            queryset = queryset.filter(due_date__lte=due_to)

        if search:
            queryset = queryset.filter(
                Q(member__membership_number__icontains=search)
                | Q(member__first_name__icontains=search)
                | Q(member__last_name__icontains=search)
                | Q(book_copy__barcode__icontains=search)
                | Q(book_copy__book__title__icontains=search)
                | Q(book_copy__book__isbn__icontains=search)
            )

        return queryset


class LoanDetailView(generics.RetrieveAPIView):
    """
    GET /api/circulation/loans/<pk>/
    """

    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated, IsCirculationStaff]

    queryset = Loan.objects.select_related(
        "member",
        "book_copy",
        "book_copy__book",
        "issued_by",
        "returned_to",
    ).prefetch_related("renewals__renewed_by")


class IssueBookView(APIView):
    """
    POST /api/circulation/issue/

    {
        "member": 1,
        "book_copy": 1,
        "due_date": "2026-11-12",
        "notes": ""
    }
    """

    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def post(self, request):
        input_serializer = IssueLoanSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        loan = issue_book(
            member_id=input_serializer.validated_data["member"],
            book_copy_id=input_serializer.validated_data["book_copy"],
            issued_by=request.user,
            due_date=input_serializer.validated_data["due_date"],
            notes=input_serializer.validated_data.get("notes", ""),
        )

        return Response(
            LoanSerializer(loan, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReturnBookView(APIView):
    """
    POST /api/circulation/loans/<pk>/return/

    Optional body:
    {
        "notes": "Returned in good condition"
    }
    """

    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def post(self, request, pk):
        input_serializer = ReturnLoanSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        loan = return_book(
            loan_id=pk,
            returned_to=request.user,
            notes=input_serializer.validated_data.get("notes", ""),
        )

        return Response(
            LoanSerializer(loan, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class RenewLoanView(APIView):
    """
    POST /api/circulation/loans/<pk>/renew/

    {
        "new_due_date": "2026-11-25",
        "reason": "Member requested an extension"
    }
    """

    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def post(self, request, pk):
        input_serializer = RenewLoanSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        loan = renew_loan(
            loan_id=pk,
            renewed_by=request.user,
            new_due_date=input_serializer.validated_data["new_due_date"],
            reason=input_serializer.validated_data.get("reason", ""),
        )

        return Response(
            LoanSerializer(loan, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class OverdueLoanListView(generics.ListAPIView):
    """
    GET /api/circulation/overdue/

    Lists currently overdue, unreturned loans.
    """

    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def get_queryset(self):
        today = timezone.localdate()

        return Loan.objects.filter(
            due_date__lt=today,
            return_date__isnull=True,
            status__in=[
                Loan.Status.ACTIVE,
                Loan.Status.OVERDUE,
            ],
        ).select_related(
            "member",
            "book_copy",
            "book_copy__book",
            "issued_by",
            "returned_to",
        ).prefetch_related("renewals__renewed_by")


class LoanRenewalListView(generics.ListAPIView):
    """
    GET /api/circulation/renewals/
    """

    serializer_class = LoanRenewalSerializer
    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def get_queryset(self):
        queryset = LoanRenewal.objects.select_related(
            "loan",
            "renewed_by",
            "loan__member",
            "loan__book_copy",
            "loan__book_copy__book",
        )

        loan_id = self.request.query_params.get("loan")
        if loan_id:
            queryset = queryset.filter(loan_id=loan_id)

        return queryset


class RefreshOverdueLoansView(APIView):
    """
    POST /api/circulation/refresh-overdue/

    Updates loan statuses based on their due dates.
    """

    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def post(self, request):
        updated_count = refresh_overdue_loans()

        return Response({
            "message": "Overdue loan statuses refreshed.",
            "updated_count": updated_count,
        })


class CirculationSummaryView(APIView):
    """
    GET /api/circulation/summary/
    """

    permission_classes = [IsAuthenticated, IsCirculationStaff]

    def get(self, request):
        today = timezone.localdate()

        loans = Loan.objects.all()

        loan_counts = {
            item["status"]: item["total"]
            for item in loans.values("status").annotate(
                total=Count("id")
            )
        }

        active_overdue = loans.filter(
            due_date__lt=today,
            return_date__isnull=True,
            status__in=[
                Loan.Status.ACTIVE,
                Loan.Status.OVERDUE,
            ],
        ).count()

        returned_today = loans.filter(
            status=Loan.Status.RETURNED,
            return_date__date=today,
        ).count()

        copy_counts = {
            item["status"]: item["total"]
            for item in BookCopy.objects.values("status").annotate(
                total=Count("id")
            )
        }

        return Response({
            "date": today.isoformat(),
            "loans": {
                "total": loans.count(),
                "active": loan_counts.get(Loan.Status.ACTIVE, 0),
                "overdue": active_overdue,
                "returned": loan_counts.get(Loan.Status.RETURNED, 0),
                "lost": loan_counts.get(Loan.Status.LOST, 0),
            },
            "returns_today": returned_today,
            "inventory": {
                "total_copies": BookCopy.objects.count(),
                "available": copy_counts.get(
                    BookCopy.Status.AVAILABLE, 0
                ),
                "on_loan": copy_counts.get(
                    BookCopy.Status.ON_LOAN, 0
                ),
                "reserved": copy_counts.get(
                    BookCopy.Status.RESERVED, 0
                ),
                "damaged": copy_counts.get(
                    BookCopy.Status.DAMAGED, 0
                ),
                "lost": copy_counts.get(
                    BookCopy.Status.LOST, 0
                ),
                "withdrawn": copy_counts.get(
                    BookCopy.Status.WITHDRAWN, 0
                ),
            },
        })
