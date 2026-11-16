from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.models import (
    Department,
    Employee,
    Attendance,
    LeaveRequest,
    SalaryStructure,
    Payroll,
    AuditLog,
)

User = get_user_model()


# =====================================================
# HELPERS
# =====================================================

def get_client_ip(request):
    # REMOTE_ADDR on purpose: X-Forwarded-For can be spoofed.
    # Behind a trusted proxy, configure the proxy/WSGI server to set it.
    return request.META.get("REMOTE_ADDR") or None


def log_action(request, action, model_name, object_id="", description="", user=None):
    if user is None and request.user and request.user.is_authenticated:
        user = request.user

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        description=description,
        ip_address=get_client_ip(request),
    )


def admin_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


# =====================================================
# REGISTER (ADMIN ACCOUNTS ONLY)
# =====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):

    first_admin = not User.objects.exists()

    if not first_admin:
        if not (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        ):
            return Response(
                {"error": "Only an administrator can create new accounts."},
                status=status.HTTP_403_FORBIDDEN,
            )

    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    first_name = request.data.get("first_name", "").strip()
    last_name = request.data.get("last_name", "").strip()
    phone_number = request.data.get("phone_number", "").strip()

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

    try:
        validate_password(password)
    except ValidationError as exc:
        return Response(
            {"error": " ".join(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        is_staff=True,
        is_superuser=True,
    )

    log_action(
        request,
        AuditLog.Action.CREATE,
        "User",
        object_id=user.pk,
        description=f"Administrator '{user.username}' created",
        user=request.user if request.user.is_authenticated else user,
    )

    return Response(
        {
            "message": "Administrator account created successfully.",
            "user": admin_payload(user),
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
        log_action(
            request,
            AuditLog.Action.LOGIN,
            "User",
            description=f"Failed login attempt for username '{username[:150]}'",
        )
        return Response(
            {"error": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "Your account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not user.is_staff:
        return Response(
            {"error": "This account does not have administrator access."},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)

    log_action(
        request,
        AuditLog.Action.LOGIN,
        "User",
        object_id=user.pk,
        description=f"{user.username} logged in",
        user=user,
    )

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

        log_action(
            request,
            AuditLog.Action.LOGOUT,
            "User",
            object_id=request.user.pk,
            description=f"{request.user.username} logged out",
        )

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
    next_month_start = (month_start + timedelta(days=32)).replace(day=1)

    EmploymentStatus = Employee.EmploymentStatus
    LeaveStatus = LeaveRequest.LeaveStatus
    PayrollStatus = Payroll.PayrollStatus

    # -----------------------------------------
    # EMPLOYEES  (one query)
    # -----------------------------------------

    employee_stats = Employee.objects.aggregate(
        total=Count("pk"),
        active=Count("pk", filter=Q(employment_status=EmploymentStatus.ACTIVE)),
        on_leave=Count("pk", filter=Q(employment_status=EmploymentStatus.ON_LEAVE)),
        inactive=Count("pk", filter=Q(employment_status=EmploymentStatus.INACTIVE)),
        terminated=Count("pk", filter=Q(employment_status=EmploymentStatus.TERMINATED)),
        new_hires_30_days=Count(
            "pk", filter=Q(date_joined__gte=today - timedelta(days=30))
        ),
    )

    gender_breakdown = dict(
        Employee.objects.exclude(employment_status=EmploymentStatus.TERMINATED)
        .values_list("gender")
        .annotate(total=Count("pk"))
    )

    # -----------------------------------------
    # ORGANISATION
    # -----------------------------------------

    total_departments = Department.objects.filter(is_active=True).count()

    department_headcount = list(
        Department.objects.filter(is_active=True)
        .annotate(
            headcount=Count(
                "employees",
                filter=~Q(employees__employment_status=EmploymentStatus.TERMINATED),
            )
        )
        .order_by("-headcount", "name")
        .values("id", "name", "headcount")[:10]
    )

    # -----------------------------------------
    # ATTENDANCE (TODAY)
    # -----------------------------------------

    attendance_today = dict(
        Attendance.objects.filter(attendance_date=today)
        .values_list("status")
        .annotate(total=Count("pk"))
    )

    present_today = attendance_today.get(Attendance.AttendanceStatus.PRESENT, 0)
    absent_today = attendance_today.get(Attendance.AttendanceStatus.ABSENT, 0)
    late_today = attendance_today.get(Attendance.AttendanceStatus.LATE, 0)
    half_day_today = attendance_today.get(Attendance.AttendanceStatus.HALF_DAY, 0)
    on_leave_today = attendance_today.get(Attendance.AttendanceStatus.ON_LEAVE, 0)

    # -----------------------------------------
    # LEAVE  (one query)
    # -----------------------------------------

    leave_stats = LeaveRequest.objects.aggregate(
        pending=Count("pk", filter=Q(status=LeaveStatus.PENDING)),
        approved=Count("pk", filter=Q(status=LeaveStatus.APPROVED)),
        rejected=Count("pk", filter=Q(status=LeaveStatus.REJECTED)),
        cancelled=Count("pk", filter=Q(status=LeaveStatus.CANCELLED)),
        away_today=Count(
            "pk",
            filter=Q(
                status=LeaveStatus.APPROVED,
                start_date__lte=today,
                end_date__gte=today,
            ),
        ),
    )

    # -----------------------------------------
    # SALARY AND PAYROLL
    # -----------------------------------------

    salary_stats = SalaryStructure.objects.filter(is_active=True).aggregate(
        count=Count("pk"),
        total_basic=Sum("basic_salary"),
    )

    payroll_all = Payroll.objects.aggregate(
        pending=Count("pk", filter=Q(status=PayrollStatus.PENDING)),
        processed=Count("pk", filter=Q(status=PayrollStatus.PROCESSED)),
        paid=Count("pk", filter=Q(status=PayrollStatus.PAID)),
    )

    payroll_month = (
        Payroll.objects.filter(
            pay_period_start__gte=month_start,
            pay_period_start__lt=next_month_start,
        )
        .exclude(status=PayrollStatus.CANCELLED)
        .aggregate(
            total_net=Sum("net_salary"),
            total_gross=Sum("gross_salary"),
            count=Count("pk"),
        )
    )

    # -----------------------------------------
    # RECENT EMPLOYEES
    # -----------------------------------------

    recent_employees = Employee.objects.select_related(
        "department"
    ).order_by("-created_at")[:10]

    recent_employees_data = [
        {
            "id": str(employee.id),
            "employee_number": employee.employee_number,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "full_name": employee.full_name,
            "department": employee.department.name,
            "employment_status": employee.employment_status,
            "date_joined": employee.date_joined.isoformat(),
            "created_at": employee.created_at.isoformat(),
        }
        for employee in recent_employees
    ]

    # -----------------------------------------
    # PENDING LEAVE REQUESTS
    # -----------------------------------------

    pending_leave = LeaveRequest.objects.filter(
        status=LeaveStatus.PENDING
    ).select_related(
        "employee",
        "leave_type",
    ).order_by("-created_at")[:10]

    pending_leave_data = [
        {
            "id": str(leave.id),
            "employee": leave.employee.full_name,
            "employee_number": leave.employee.employee_number,
            "leave_type": leave.leave_type.name,
            "start_date": leave.start_date.isoformat(),
            "end_date": leave.end_date.isoformat(),
            "days_requested": str(leave.days_requested),
            "created_at": leave.created_at.isoformat(),
        }
        for leave in pending_leave
    ]

    # -----------------------------------------
    # RECENT PAYROLL
    # -----------------------------------------

    recent_payroll = Payroll.objects.select_related(
        "employee"
    ).order_by("-pay_period_start", "-created_at")[:10]

    recent_payroll_data = [
        {
            "id": str(payroll.id),
            "employee": payroll.employee.full_name,
            "employee_number": payroll.employee.employee_number,
            "pay_period_start": payroll.pay_period_start.isoformat(),
            "pay_period_end": payroll.pay_period_end.isoformat(),
            "net_salary": str(payroll.net_salary),
            "currency": payroll.currency,
            "status": payroll.status,
            "reference_number": payroll.reference_number,
        }
        for payroll in recent_payroll
    ]

    # -----------------------------------------
    # RECENT ACTIVITY (AUDIT LOG)
    # -----------------------------------------

    recent_activity = AuditLog.objects.select_related(
        "user"
    ).order_by("-created_at")[:10]

    recent_activity_data = [
        {
            "id": str(entry.id),
            "user": entry.user.username if entry.user else None,
            "action": entry.action,
            "model_name": entry.model_name,
            "object_id": entry.object_id,
            "description": entry.description,
            "created_at": entry.created_at.isoformat(),
        }
        for entry in recent_activity
    ]

    # -----------------------------------------
    # DASHBOARD RESPONSE
    # -----------------------------------------

    return Response(
        {
            "today": today.isoformat(),

            "summary": {

                # Employees
                "total_employees": employee_stats["total"],
                "active_employees": employee_stats["active"],
                "on_leave_employees": employee_stats["on_leave"],
                "inactive_employees": employee_stats["inactive"],
                "terminated_employees": employee_stats["terminated"],
                "new_hires_30_days": employee_stats["new_hires_30_days"],

                # Organisation
                "total_departments": total_departments,
            
                # Attendance (today)
                "present_today": present_today,
                "absent_today": absent_today,
                "late_today": late_today,
                "half_day_today": half_day_today,
                "on_leave_today": on_leave_today,

                # Leave
                "pending_leave_requests": leave_stats["pending"],
                "approved_leave_requests": leave_stats["approved"],
                "rejected_leave_requests": leave_stats["rejected"],
                "cancelled_leave_requests": leave_stats["cancelled"],
                "employees_away_today": leave_stats["away_today"],

                # Salary and payroll
                "active_salary_structures": salary_stats["count"] or 0,
                "total_basic_salary": str(salary_stats["total_basic"] or Decimal("0.00")),
                "pending_payroll": payroll_all["pending"],
                "processed_payroll": payroll_all["processed"],
                "paid_payroll": payroll_all["paid"],
                "monthly_payroll_count": payroll_month["count"] or 0,
                "monthly_payroll_gross": str(payroll_month["total_gross"] or Decimal("0.00")),
                "monthly_payroll_net": str(payroll_month["total_net"] or Decimal("0.00")),
            },

            "gender_breakdown": gender_breakdown,
            "department_headcount": department_headcount,

            "recent_employees": recent_employees_data,
            "pending_leave_requests": pending_leave_data,
            "recent_payroll": recent_payroll_data,
            "recent_activity": recent_activity_data,
        },
        status=status.HTTP_200_OK,
    )