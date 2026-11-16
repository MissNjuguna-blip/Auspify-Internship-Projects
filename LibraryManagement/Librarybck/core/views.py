
from decimal import Decimal

from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.db.models import Sum, Count, Avg, F, DecimalField, ExpressionWrapper
from django.db.models.functions import TruncMonth
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.models import (
    Author,
    Publisher,
    Category,
    Book,
    Member,
    Shelf,
    BookCopy,
    Loan,
    LoanRenewal,
    Fine,
    FinePayment,
    Notification,
    AuditLog,
)

User = get_user_model()


# =====================================================
# REGISTER
# =====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    phone_number = request.data.get("phone_number", "")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    if not username or not email or not password:
        return Response(
            {"error": "Username, email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": "Username already taken."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "Email already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {"error": "Password must contain at least 8 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        phone_number=phone_number,
        first_name=first_name,
        last_name=last_name,
        is_staff=False,
        is_superuser=False,
    )

    return Response(
        {
            "message": "Account created successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        },
        status=status.HTTP_201_CREATED,
    )


# =====================================================
# LOGIN
# =====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request=request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {"error": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "Your account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
            "refresh": str(refresh),
            "access_token": str(refresh.access_token),
        },
        status=status.HTTP_200_OK,
    )


# =====================================================
# LOGOUT
# =====================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {"error": "Refresh token is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)

        if str(token["user_id"]) != str(request.user.pk):
            return Response(
                {"error": "This token does not belong to this user."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token.blacklist()

        return Response(
            {"message": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )

    except TokenError:
        return Response(
            {"error": "Invalid or expired refresh token."},
            status=status.HTTP_400_BAD_REQUEST,
        )


# =====================================================
# ADMIN DASHBOARD
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    today = timezone.localdate()
    month_start = today.replace(day=1)

    # -------------------------------------------------
    # BOOKS AND INVENTORY
    # -------------------------------------------------

    total_books = Book.objects.count()
    total_authors = Author.objects.count()
    total_publishers = Publisher.objects.count()
    total_categories = Category.objects.count()
    total_shelves = Shelf.objects.count()
    total_copies = BookCopy.objects.count()

    available_copies = BookCopy.objects.filter(
        status=BookCopy.Status.AVAILABLE
    ).count()

    copies_on_loan = BookCopy.objects.filter(
        status=BookCopy.Status.ON_LOAN
    ).count()

    reserved_copies = BookCopy.objects.filter(
        status=BookCopy.Status.RESERVED
    ).count()

    damaged_copies = BookCopy.objects.filter(
        status=BookCopy.Status.DAMAGED
    ).count()

    lost_copies = BookCopy.objects.filter(
        status=BookCopy.Status.LOST
    ).count()

    withdrawn_copies = BookCopy.objects.filter(
        status=BookCopy.Status.WITHDRAWN
    ).count()

    # -------------------------------------------------
    # MEMBERS
    # -------------------------------------------------

    total_members = Member.objects.count()

    active_members = Member.objects.filter(
        status=Member.Status.ACTIVE
    ).count()

    suspended_members = Member.objects.filter(
        status=Member.Status.SUSPENDED
    ).count()

    expired_members = Member.objects.filter(
        status=Member.Status.EXPIRED
    ).count()

    closed_members = Member.objects.filter(
        status=Member.Status.CLOSED
    ).count()

    # -------------------------------------------------
    # LOANS
    # -------------------------------------------------

    total_loans = Loan.objects.count()

    active_loans = Loan.objects.filter(
        status=Loan.Status.ACTIVE
    ).count()

    returned_loans = Loan.objects.filter(
        status=Loan.Status.RETURNED
    ).count()

    overdue_loans = Loan.objects.filter(
        due_date__lt=today,
        status__in=[
            Loan.Status.ACTIVE,
            Loan.Status.OVERDUE,
        ],
    ).count()

    lost_loans = Loan.objects.filter(
        status=Loan.Status.LOST
    ).count()

    monthly_loans = Loan.objects.filter(
        issue_date__date__gte=month_start,
        issue_date__date__lte=today,
    ).count()

    monthly_returns = Loan.objects.filter(
        return_date__date__gte=month_start,
        return_date__date__lte=today,
        status=Loan.Status.RETURNED,
    ).count()

    # -------------------------------------------------
    # FINES
    # -------------------------------------------------

    fine_stats = Fine.objects.aggregate(
        total=Sum("amount"),
        amount_paid=Sum("amount_paid"),
        count=Count("id"),
        average=Avg("amount"),
    )

    total_fines = fine_stats["total"] or Decimal("0.00")
    total_fine_amount_paid = (
        fine_stats["amount_paid"] or Decimal("0.00")
    )
    fine_count = fine_stats["count"] or 0
    average_fine = fine_stats["average"] or Decimal("0.00")

    outstanding_fines = Fine.objects.filter(
        status__in=[
            Fine.Status.UNPAID,
            Fine.Status.PARTIAL,
        ]
    ).aggregate(
        total=Sum(
            ExpressionWrapper(
                F("amount") - F("amount_paid"),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2,
                ),
            )
        )
    )["total"] or Decimal("0.00")

    paid_fines = Fine.objects.filter(
        status=Fine.Status.PAID
    ).count()

    waived_fines = Fine.objects.filter(
        status=Fine.Status.WAIVED
    ).count()

    # -------------------------------------------------
    # PAYMENTS
    # -------------------------------------------------

    payment_stats = FinePayment.objects.aggregate(
        total=Sum("amount"),
        count=Count("id"),
        average=Avg("amount"),
    )

    total_payments = payment_stats["total"] or Decimal("0.00")
    payment_count = payment_stats["count"] or 0
    average_payment = payment_stats["average"] or Decimal("0.00")

    monthly_payment_stats = FinePayment.objects.filter(
        paid_at__date__gte=month_start,
        paid_at__date__lte=today,
    ).aggregate(
        total=Sum("amount"),
        count=Count("id"),
    )

    monthly_payments = (
        monthly_payment_stats["total"] or Decimal("0.00")
    )
    monthly_payment_count = monthly_payment_stats["count"] or 0

    # -------------------------------------------------
    # NOTIFICATIONS
    # -------------------------------------------------

    pending_notifications = Notification.objects.filter(
        status=Notification.Status.PENDING
    ).count()

    failed_notifications = Notification.objects.filter(
        status=Notification.Status.FAILED
    ).count()

    unread_notifications = Notification.objects.filter(
        status=Notification.Status.SENT,
        read_at__isnull=True,
    ).count()

    # -------------------------------------------------
    # RECENT LOANS
    # -------------------------------------------------

    recent_loans = (
        Loan.objects
        .select_related(
            "member",
            "book_copy__book",
            "issued_by",
        )
        .order_by("-issue_date")[:10]
    )

    recent_loans_data = []

    for loan in recent_loans:
        recent_loans_data.append({
            "id": loan.id,
            "member_name": (
                f"{loan.member.first_name} "
                f"{loan.member.last_name}"
            ),
            "membership_number": loan.member.membership_number,
            "book_title": loan.book_copy.book.title,
            "barcode": loan.book_copy.barcode,
            "issue_date": loan.issue_date.isoformat(),
            "due_date": loan.due_date.isoformat(),
            "return_date": (
                loan.return_date.isoformat()
                if loan.return_date else None
            ),
            "status": loan.status,
            "issued_by": loan.issued_by.username,
        })

    # -------------------------------------------------
    # RECENT MEMBERS
    # -------------------------------------------------

    recent_members = Member.objects.order_by(
        "-created_at"
    )[:10]

    recent_members_data = []

    for member in recent_members:
        recent_members_data.append({
            "id": member.id,
            "membership_number": member.membership_number,
            "full_name": (
                f"{member.first_name} "
                f"{member.last_name}"
            ),
            "first_name": member.first_name,
            "last_name": member.last_name,
            "email": member.email,
            "phone_number": member.phone_number,
            "membership_type": member.membership_type,
            "status": member.status,
            "joined_date": (
                member.joined_date.isoformat()
                if member.joined_date else None
            ),
            "expiry_date": (
                member.expiry_date.isoformat()
                if member.expiry_date else None
            ),
        })

    # -------------------------------------------------
    # RECENT BOOKS
    # -------------------------------------------------

    recent_books = (
        Book.objects
        .prefetch_related("authors", "categories")
        .select_related("publisher")
        .order_by("-created_at")[:10]
    )

    recent_books_data = []

    for book in recent_books:
        recent_books_data.append({
            "id": book.id,
            "title": book.title,
            "subtitle": book.subtitle,
            "isbn": book.isbn,
            "authors": [
                str(author)
                for author in book.authors.all()
            ],
            "publisher": (
                book.publisher.name
                if book.publisher else None
            ),
            "categories": [
                category.name
                for category in book.categories.all()
            ],
            "publication_year": book.publication_year,
            "language": book.language,
            "total_copies": book.copies.count(),
            "available_copies": book.copies.filter(
                status=BookCopy.Status.AVAILABLE
            ).count(),
        })

    # -------------------------------------------------
    # RECENT FINES
    # -------------------------------------------------

    recent_fines = (
        Fine.objects
        .select_related(
            "loan__member",
            "loan__book_copy__book",
        )
        .order_by("-created_at")[:10]
    )

    recent_fines_data = []

    for fine in recent_fines:
        recent_fines_data.append({
            "id": fine.id,
            "member": (
                f"{fine.loan.member.first_name} "
                f"{fine.loan.member.last_name}"
            ),
            "membership_number": fine.loan.member.membership_number,
            "book_title": fine.loan.book_copy.book.title,
            "fine_type": fine.fine_type,
            "amount": str(fine.amount),
            "amount_paid": str(fine.amount_paid),
            "balance": str(fine.amount - fine.amount_paid),
            "status": fine.status,
            "created_at": fine.created_at.isoformat(),
        })

    # -------------------------------------------------
    # MONTHLY LOAN CHART
    # -------------------------------------------------

    monthly_loan_stats = (
        Loan.objects
        .annotate(month=TruncMonth("issue_date"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )

    monthly_loans_data = [
        {
            "month": item["month"].strftime("%Y-%m"),
            "total": item["total"],
        }
        for item in monthly_loan_stats
        if item["month"] is not None
    ]

    # -------------------------------------------------
    # MONTHLY PAYMENT CHART
    # -------------------------------------------------

    monthly_payment_chart = (
        FinePayment.objects
        .annotate(month=TruncMonth("paid_at"))
        .values("month")
        .annotate(
            total=Sum("amount"),
            count=Count("id"),
        )
        .order_by("month")
    )

    monthly_payments_data = [
        {
            "month": item["month"].strftime("%Y-%m"),
            "total": str(item["total"] or Decimal("0.00")),
            "count": item["count"],
        }
        for item in monthly_payment_chart
        if item["month"] is not None
    ]

    # -------------------------------------------------
    # RECENT AUDIT LOGS
    # -------------------------------------------------

    recent_audit_logs = (
        AuditLog.objects
        .select_related("actor")
        .order_by("-created_at")[:10]
    )

    recent_audit_logs_data = [
        {
            "id": log.id,
            "actor": log.actor.username if log.actor else None,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "description": log.description,
            "created_at": log.created_at.isoformat(),
        }
        for log in recent_audit_logs
    ]

    # -------------------------------------------------
    # DASHBOARD RESPONSE
    # -------------------------------------------------

    return Response(
        {
            "today": today.isoformat(),

            "summary": {
                # Books and inventory
                "total_books": total_books,
                "total_authors": total_authors,
                "total_publishers": total_publishers,
                "total_categories": total_categories,
                "total_shelves": total_shelves,
                "total_copies": total_copies,
                "available_copies": available_copies,
                "copies_on_loan": copies_on_loan,
                "reserved_copies": reserved_copies,
                "damaged_copies": damaged_copies,
                "lost_copies": lost_copies,
                "withdrawn_copies": withdrawn_copies,

                # Members
                "total_members": total_members,
                "active_members": active_members,
                "suspended_members": suspended_members,
                "expired_members": expired_members,
                "closed_members": closed_members,

                # Loans
                "total_loans": total_loans,
                "active_loans": active_loans,
                "returned_loans": returned_loans,
                "overdue_loans": overdue_loans,
                "lost_loans": lost_loans,
                "monthly_loans": monthly_loans,
                "monthly_returns": monthly_returns,

                # Fines
                "total_fines": str(total_fines),
                "total_fine_amount_paid": str(total_fine_amount_paid),
                "fine_count": fine_count,
                "average_fine": str(average_fine),
                "outstanding_fines": str(outstanding_fines),
                "paid_fines": paid_fines,
                "waived_fines": waived_fines,

                # Payments
                "total_payments": str(total_payments),
                "payment_count": payment_count,
                "average_payment": str(average_payment),
                "monthly_payments": str(monthly_payments),
                "monthly_payment_count": monthly_payment_count,

                # Notifications
                "pending_notifications": pending_notifications,
                "failed_notifications": failed_notifications,
                "unread_notifications": unread_notifications,
            },

            "recent_loans": recent_loans_data,
            "recent_members": recent_members_data,
            "recent_books": recent_books_data,
            "recent_fines": recent_fines_data,
            "recent_audit_logs": recent_audit_logs_data,

            "monthly_loans": monthly_loans_data,
            "monthly_payments": monthly_payments_data,
        },
        status=status.HTTP_200_OK,
    )
