from decimal import Decimal

from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.db.models import Sum, Count, Avg
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.models import (
    Student,
    Guardian,
    StudentGuardian,
    School,
    Staff,
    AcademicYear,
    Term,
    ClassRoom,
    Subject,
    Enrollment,
    StudentAttendance,
    Examination,
    StudentResult,
    FeeCategory,
    FeePayment,
    Announcement,
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
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    admission_number = request.data.get("admission_number", "").strip()

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

    if admission_number and Student.objects.filter(
        admission_number=admission_number
    ).exists():
        return Response(
            {"error": "Admission number already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    student = None

    if admission_number:
        student = Student.objects.create(
            admission_number=admission_number,
            first_name=first_name,
            last_name=last_name,
        )

    return Response(
        {
            "message": "Account created successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "student_id": student.id if student else None,
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

    # -----------------------------------------
    # STUDENTS
    # -----------------------------------------

    total_students = Student.objects.count()

    # -----------------------------------------
    # ACADEMICS
    # -----------------------------------------

    total_schools = School.objects.count()
    total_staff = Staff.objects.count()
    total_academic_years = AcademicYear.objects.count()
    total_terms = Term.objects.count()
    total_classrooms = ClassRoom.objects.count()
    total_subjects = Subject.objects.count()
    total_enrollments = Enrollment.objects.count()

    # -----------------------------------------
    # ATTENDANCE
    # -----------------------------------------

    total_attendance = StudentAttendance.objects.count()

    present_attendance = StudentAttendance.objects.filter(
        status="present"
    ).count()

    absent_attendance = StudentAttendance.objects.filter(
        status="absent"
    ).count()

    late_attendance = StudentAttendance.objects.filter(
        status="late"
    ).count()

    excused_attendance = StudentAttendance.objects.filter(
        status="excused"
    ).count()

    # -----------------------------------------
    # EXAMINATIONS AND RESULTS
    # -----------------------------------------

    total_examinations = Examination.objects.count()
    total_results = StudentResult.objects.count()

    average_marks = StudentResult.objects.aggregate(
        average=Avg("marks")
    )["average"] or Decimal("0.00")

    # -----------------------------------------
    # FINANCE
    # -----------------------------------------

    total_fee_categories = FeeCategory.objects.count()

    payment_stats = FeePayment.objects.aggregate(
        total=Sum("amount"),
        count=Count("id"),
        average=Avg("amount"),
    )

    total_payments = payment_stats["total"] or Decimal("0.00")
    payment_count = payment_stats["count"] or 0
    average_payment = payment_stats["average"] or Decimal("0.00")

    monthly_payments = FeePayment.objects.filter(
        payment_date__year=today.year,
        payment_date__month=today.month,
    ).aggregate(
        total=Sum("amount"),
    )["total"] or Decimal("0.00")

    monthly_payment_count = FeePayment.objects.filter(
        payment_date__year=today.year,
        payment_date__month=today.month,
    ).count()

    # -----------------------------------------
    # COMMUNICATION
    # -----------------------------------------

    total_announcements = Announcement.objects.count()

    published_announcements = Announcement.objects.filter(
        published=True
    ).count()

    unpublished_announcements = Announcement.objects.filter(
        published=False
    ).count()

    # -----------------------------------------
    # RECENT STUDENTS
    # -----------------------------------------

    recent_students = Student.objects.order_by(
        "-created_at"
    )[:10]

    recent_students_data = [
        {
            "id": student.id,
            "admission_number": student.admission_number,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "full_name": f"{student.first_name} {student.last_name}",
            "created_at": student.created_at.isoformat(),
        }
        for student in recent_students
    ]

    # -----------------------------------------
    # RECENT ENROLLMENTS
    # -----------------------------------------

    recent_enrollments = Enrollment.objects.select_related(
        "student",
        "classroom",
        "academic_year",
    ).order_by("-created_at")[:10]

    recent_enrollments_data = [
        {
            "id": enrollment.id,
            "student": str(enrollment.student),
            "admission_number": enrollment.student.admission_number,
            "classroom": enrollment.classroom.name,
            "academic_year": enrollment.academic_year.name,
            "enrollment_date": enrollment.enrollment_date.isoformat(),
        }
        for enrollment in recent_enrollments
    ]

    # -----------------------------------------
    # RECENT PAYMENTS
    # -----------------------------------------

    recent_payments = FeePayment.objects.select_related(
        "student"
    ).order_by("-payment_date")[:10]

    recent_payments_data = [
        {
            "id": payment.id,
            "student": str(payment.student),
            "admission_number": payment.student.admission_number,
            "amount": str(payment.amount),
            "payment_date": payment.payment_date.isoformat(),
            "reference_number": payment.reference_number,
        }
        for payment in recent_payments
    ]

    # -----------------------------------------
    # RECENT ANNOUNCEMENTS
    # -----------------------------------------

    recent_announcements = Announcement.objects.select_related(
        "created_by"
    ).order_by("-created_at")[:10]

    recent_announcements_data = [
        {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "created_by": announcement.created_by.username,
            "published": announcement.published,
            "created_at": announcement.created_at.isoformat(),
        }
        for announcement in recent_announcements
    ]

    # -----------------------------------------
    # DASHBOARD RESPONSE
    # -----------------------------------------

    return Response(
        {
            "today": today.isoformat(),

            "summary": {

                # Students
                "total_students": total_students,

                # Academics
                "total_schools": total_schools,
                "total_staff": total_staff,
                "total_academic_years": total_academic_years,
                "total_terms": total_terms,
                "total_classrooms": total_classrooms,
                "total_subjects": total_subjects,
                "total_enrollments": total_enrollments,

                # Attendance
                "total_attendance": total_attendance,
                "present_attendance": present_attendance,
                "absent_attendance": absent_attendance,
                "late_attendance": late_attendance,
                "excused_attendance": excused_attendance,

                # Examinations
                "total_examinations": total_examinations,
                "total_results": total_results,
                "average_marks": str(average_marks),

                # Finance
                "total_fee_categories": total_fee_categories,
                "total_payments": str(total_payments),
                "payment_count": payment_count,
                "average_payment": str(average_payment),
                "monthly_payments": str(monthly_payments),
                "monthly_payment_count": monthly_payment_count,

                # Announcements
                "total_announcements": total_announcements,
                "published_announcements": published_announcements,
                "unpublished_announcements": unpublished_announcements,
            },

            "recent_students": recent_students_data,
            "recent_enrollments": recent_enrollments_data,
            "recent_payments": recent_payments_data,
            "recent_announcements": recent_announcements_data,
        },
        status=status.HTTP_200_OK,
    )