
import csv
import uuid
from decimal import Decimal

from django.db import transaction, IntegrityError
from django.db.models import Q, Sum, Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from core.models import (
    Employee,
    LeaveType,
    LeaveRequest,
    LeaveBalance,
    AuditLog,
)

from core.views import log_action

from .serializers import (
    LeaveTypeSerializer,
    LeaveRequestSerializer,
    LeaveBalanceSerializer,
)


# ============================================================
# HELPERS
# ============================================================

class LeavePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


def bad_request(message):
    return Response(
        {"error": message},
        status=status.HTTP_400_BAD_REQUEST
    )


def parse_uuid(value, field_name):
    if not value:
        return None

    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        raise ValueError(f"'{field_name}' must be a valid UUID.")


def csv_safe(value):
    text = "" if value is None else str(value)

    if text[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + text

    return text


# ============================================================
# 1. LEAVE TYPE LIST + CREATE
# ============================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def leave_type_list_create(request):

    if request.method == "GET":

        queryset = LeaveType.objects.all()

        active = request.query_params.get("active")

        if active is not None:
            queryset = queryset.filter(
                is_active=active.lower() == "true"
            )

        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
            )

        paginator = LeavePagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = LeaveTypeSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    serializer = LeaveTypeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    leave_type = serializer.save()

    log_action(
        request,
        AuditLog.Action.CREATE,
        "LeaveType",
        object_id=leave_type.pk,
        description=f"Leave type '{leave_type.name}' created."
    )

    return Response(
        LeaveTypeSerializer(leave_type).data,
        status=status.HTTP_201_CREATED
    )


# ============================================================
# 2. LEAVE TYPE RETRIEVE + UPDATE + DELETE
# ============================================================

@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def leave_type_detail(request, pk):

    leave_type = get_object_or_404(
        LeaveType,
        pk=pk
    )

    if request.method == "GET":
        return Response(LeaveTypeSerializer(leave_type).data)

    if request.method == "DELETE":

        if leave_type.leave_requests.exists():
            return bad_request(
                "This leave type has existing leave requests. "
                "Deactivate it instead of deleting it."
            )

        if leave_type.balances.exists():
            return bad_request(
                "This leave type has existing balances. "
                "Deactivate it instead of deleting it."
            )

        name = leave_type.name
        leave_type_id = leave_type.pk
        leave_type.delete()

        log_action(
            request,
            AuditLog.Action.DELETE,
            "LeaveType",
            object_id=leave_type_id,
            description=f"Leave type '{name}' deleted."
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = LeaveTypeSerializer(
        leave_type,
        data=request.data,
        partial=request.method == "PATCH"
    )

    serializer.is_valid(raise_exception=True)
    leave_type = serializer.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "LeaveType",
        object_id=leave_type.pk,
        description=f"Leave type '{leave_type.name}' updated."
    )

    return Response(LeaveTypeSerializer(leave_type).data)


# ============================================================
# 3. LEAVE REQUEST LIST + CREATE
# ============================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def leave_request_list_create(request):

    if request.method == "GET":

        queryset = LeaveRequest.objects.select_related(
            "employee",
            "employee__department",
            "leave_type",
            "reviewed_by"
        )

        try:
            employee_id = parse_uuid(
                request.query_params.get("employee"),
                "employee"
            )

            leave_type_id = parse_uuid(
                request.query_params.get("leave_type"),
                "leave_type"
            )

        except ValueError as exc:
            return bad_request(str(exc))

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if leave_type_id:
            queryset = queryset.filter(leave_type_id=leave_type_id)

        leave_status = request.query_params.get("status")

        if leave_status:
            leave_status = leave_status.upper()

            if leave_status not in LeaveRequest.LeaveStatus.values:
                return bad_request(
                    "Invalid leave status."
                )

            queryset = queryset.filter(status=leave_status)

        department = request.query_params.get("department")

        if department:
            try:
                department_id = parse_uuid(department, "department")
            except ValueError as exc:
                return bad_request(str(exc))

            queryset = queryset.filter(
                employee__department_id=department_id
            )

        search = (request.query_params.get("search") or "").strip()

        if search:
            queryset = queryset.filter(
                Q(employee__first_name__icontains=search)
                | Q(employee__last_name__icontains=search)
                | Q(employee__employee_number__icontains=search)
                | Q(leave_type__name__icontains=search)
            )

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            queryset = queryset.filter(
                end_date__gte=start_date
            )

        if end_date:
            queryset = queryset.filter(
                start_date__lte=end_date
            )

        paginator = LeavePagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = LeaveRequestSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    serializer = LeaveRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    leave_request = serializer.save()

    log_action(
        request,
        AuditLog.Action.CREATE,
        "LeaveRequest",
        object_id=leave_request.pk,
        description=(
            f"Leave request submitted for "
            f"{leave_request.employee.employee_number}."
        )
    )

    return Response(
        LeaveRequestSerializer(leave_request).data,
        status=status.HTTP_201_CREATED
    )


# ============================================================
# 4. LEAVE REQUEST RETRIEVE + UPDATE + DELETE
# ============================================================

@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def leave_request_detail(request, pk):

    leave_request = get_object_or_404(
        LeaveRequest.objects.select_related(
            "employee",
            "leave_type",
            "reviewed_by"
        ),
        pk=pk
    )

    if request.method == "GET":
        return Response(
            LeaveRequestSerializer(leave_request).data
        )

    if leave_request.status != LeaveRequest.LeaveStatus.PENDING:
        return bad_request(
            "Only pending leave requests can be edited or deleted. "
            "Use the cancellation endpoint for approved requests."
        )

    if request.method == "DELETE":

        employee_number = leave_request.employee.employee_number
        request_id = leave_request.pk

        leave_request.delete()

        log_action(
            request,
            AuditLog.Action.DELETE,
            "LeaveRequest",
            object_id=request_id,
            description=f"Pending leave request for {employee_number} deleted."
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = LeaveRequestSerializer(
        leave_request,
        data=request.data,
        partial=request.method == "PATCH"
    )

    serializer.is_valid(raise_exception=True)
    leave_request = serializer.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "LeaveRequest",
        object_id=leave_request.pk,
        description="Pending leave request updated."
    )

    return Response(
        LeaveRequestSerializer(leave_request).data
    )

# ============================================================
# 5. APPROVE LEAVE REQUEST
# ============================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_leave_request(request, pk):

    comment = request.data.get("review_comment", "")

    with transaction.atomic():

        leave_request = get_object_or_404(
            LeaveRequest.objects.select_for_update().select_related(
                "employee",
                "leave_type"
            ),
            pk=pk
        )

        if leave_request.status != LeaveRequest.LeaveStatus.PENDING:
            return bad_request(
                "Only pending leave requests can be approved."
            )

        # The current balance model stores one annual balance.
        # Cross-year requests need to be split into separate applications.
        if leave_request.start_date.year != leave_request.end_date.year:
            return bad_request(
                "Leave requests cannot cross calendar years. "
                "Create separate requests for each year."
            )

        balance = (
            LeaveBalance.objects.select_for_update()
            .filter(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=leave_request.start_date.year
            )
            .first()
        )

        if balance is None:
            return bad_request(
                "No leave balance exists for this employee and leave type."
            )

        remaining = balance.allocated_days - balance.used_days

        if remaining < leave_request.days_requested:
            return Response(
                {
                    "error": "Insufficient leave balance.",
                    "allocated_days": str(balance.allocated_days),
                    "used_days": str(balance.used_days),
                    "remaining_days": str(remaining),
                    "requested_days": str(leave_request.days_requested),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        balance.used_days += leave_request.days_requested
        balance.save(update_fields=["used_days", "updated_at"])

        leave_request.status = LeaveRequest.LeaveStatus.APPROVED
        leave_request.reviewed_by = request.user
        leave_request.reviewed_at = timezone.now()
        leave_request.review_comment = comment

        leave_request.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_comment",
                "updated_at"
            ]
        )

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "LeaveRequest",
        object_id=leave_request.pk,
        description=(
            f"Leave approved for "
            f"{leave_request.employee.employee_number}. "
            f"{leave_request.days_requested} days deducted."
        )
    )

    return Response({
        "message": "Leave request approved successfully.",
        "leave_request": LeaveRequestSerializer(leave_request).data,
        "remaining_days": str(balance.remaining_days),
    })


# ============================================================
# 6. REJECT LEAVE REQUEST
# ============================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def reject_leave_request(request, pk):

    comment = request.data.get("review_comment", "").strip()

    if not comment:
        return bad_request(
            "A reason for rejecting the leave request is required."
        )

    with transaction.atomic():

        leave_request = get_object_or_404(
            LeaveRequest.objects.select_for_update().select_related(
                "employee",
                "leave_type"
            ),
            pk=pk
        )

        if leave_request.status != LeaveRequest.LeaveStatus.PENDING:
            return bad_request(
                "Only pending leave requests can be rejected."
            )

        leave_request.status = LeaveRequest.LeaveStatus.REJECTED
        leave_request.reviewed_by = request.user
        leave_request.reviewed_at = timezone.now()
        leave_request.review_comment = comment

        leave_request.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_comment",
                "updated_at"
            ]
        )

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "LeaveRequest",
        object_id=leave_request.pk,
        description=(
            f"Leave request rejected for "
            f"{leave_request.employee.employee_number}."
        )
    )

    return Response({
        "message": "Leave request rejected.",
        "leave_request": LeaveRequestSerializer(leave_request).data,
    })


# ============================================================
# 7. CANCEL LEAVE REQUEST
# ============================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def cancel_leave_request(request, pk):

    with transaction.atomic():

        leave_request = get_object_or_404(
            LeaveRequest.objects.select_for_update().select_related(
                "employee",
                "leave_type"
            ),
            pk=pk
        )

        if leave_request.status not in (
            LeaveRequest.LeaveStatus.PENDING,
            LeaveRequest.LeaveStatus.APPROVED
        ):
            return bad_request(
                "Only pending or approved leave requests can be cancelled."
            )

        was_approved = (
            leave_request.status == LeaveRequest.LeaveStatus.APPROVED
        )

        if was_approved:

            balance = (
                LeaveBalance.objects.select_for_update()
                .filter(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=leave_request.start_date.year
                )
                .first()
            )

            if balance is None:
                return Response(
                    {"error": "The original leave balance could not be found."},
                    status=status.HTTP_409_CONFLICT
                )

            if balance.used_days < leave_request.days_requested:
                return Response(
                    {"error": "Leave balance is inconsistent. Cancellation was not completed."},
                    status=status.HTTP_409_CONFLICT
                )

            balance.used_days -= leave_request.days_requested
            balance.save(update_fields=["used_days", "updated_at"])

        leave_request.status = LeaveRequest.LeaveStatus.CANCELLED
        leave_request.reviewed_by = request.user
        leave_request.reviewed_at = timezone.now()
        leave_request.review_comment = request.data.get(
            "review_comment",
            "Cancelled by administrator."
        )

        leave_request.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_comment",
                "updated_at"
            ]
        )

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "LeaveRequest",
        object_id=leave_request.pk,
        description=(
            f"Leave request cancelled for "
            f"{leave_request.employee.employee_number}."
            + (
                f" {leave_request.days_requested} days restored."
                if was_approved else ""
            )
        )
    )

    return Response({
        "message": "Leave request cancelled successfully.",
        "leave_request": LeaveRequestSerializer(leave_request).data,
    })

# ============================================================
# 8. LEAVE BALANCE LIST + CREATE
# ============================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def leave_balance_list_create(request):

    if request.method == "GET":

        queryset = LeaveBalance.objects.select_related(
            "employee",
            "leave_type"
        )

        try:
            employee_id = parse_uuid(
                request.query_params.get("employee"),
                "employee"
            )

            leave_type_id = parse_uuid(
                request.query_params.get("leave_type"),
                "leave_type"
            )

        except ValueError as exc:
            return bad_request(str(exc))

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if leave_type_id:
            queryset = queryset.filter(leave_type_id=leave_type_id)

        year = request.query_params.get("year")

        if year:
            try:
                year = int(year)
                if year < 1900 or year > 9999:
                    raise ValueError
            except ValueError:
                return bad_request("Year must be a valid four-digit year.")

            queryset = queryset.filter(year=year)

        paginator = LeavePagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = LeaveBalanceSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    serializer = LeaveBalanceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            balance = serializer.save()

    except IntegrityError:
        return bad_request(
            "A balance already exists for this employee, leave type and year."
        )

    log_action(
        request,
        AuditLog.Action.CREATE,
        "LeaveBalance",
        object_id=balance.pk,
        description=(
            f"Leave balance allocated to "
            f"{balance.employee.employee_number}: "
            f"{balance.allocated_days} days."
        )
    )

    return Response(
        LeaveBalanceSerializer(balance).data,
        status=status.HTTP_201_CREATED
    )


# ============================================================
# 9. LEAVE BALANCE RETRIEVE + UPDATE
# ============================================================

@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAdminUser])
def leave_balance_detail(request, pk):

    balance = get_object_or_404(
        LeaveBalance.objects.select_related(
            "employee",
            "leave_type"
        ),
        pk=pk
    )

    if request.method == "GET":
        return Response(
            LeaveBalanceSerializer(balance).data
        )

    with transaction.atomic():

        balance = get_object_or_404(
            LeaveBalance.objects.select_for_update(),
            pk=pk
        )

        serializer = LeaveBalanceSerializer(
            balance,
            data=request.data,
            partial=request.method == "PATCH"
        )

        serializer.is_valid(raise_exception=True)
        balance = serializer.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "LeaveBalance",
        object_id=balance.pk,
        description=(
            f"Leave allocation updated for "
            f"{balance.employee.employee_number}."
        )
    )

    return Response(
        LeaveBalanceSerializer(balance).data
    )


# ============================================================
# 10. EMPLOYEE LEAVE BALANCE SUMMARY
# ============================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def employee_leave_summary(request, employee_id):

    try:
        employee_id = uuid.UUID(str(employee_id))
    except ValueError:
        return bad_request("Invalid employee UUID.")

    employee = get_object_or_404(
        Employee,
        pk=employee_id
    )

    year = request.query_params.get(
        "year",
        timezone.localdate().year
    )

    try:
        year = int(year)
        if year < 1900 or year > 9999:
            raise ValueError
    except (ValueError, TypeError):
        return bad_request("Invalid year.")

    balances = LeaveBalance.objects.filter(
        employee=employee,
        year=year
    ).select_related("leave_type")

    balance_data = []

    for balance in balances:

        balance_data.append({
            "leave_type": balance.leave_type.name,
            "allocated_days": str(balance.allocated_days),
            "used_days": str(balance.used_days),
            "remaining_days": str(balance.remaining_days),
            "is_paid": balance.leave_type.is_paid,
        })

    return Response({
        "employee_id": str(employee.pk),
        "employee_number": employee.employee_number,
        "employee_name": employee.full_name,
        "year": year,
        "balances": balance_data,
        "total_allocated": str(
            sum(
                (b.allocated_days for b in balances),
                Decimal("0")
            )
        ),
        "total_used": str(
            sum(
                (b.used_days for b in balances),
                Decimal("0")
            )
        ),
    })

# ============================================================
# 11. LEAVE DASHBOARD SUMMARY
# ============================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def leave_dashboard_summary(request):

    today = timezone.localdate()

    queryset = LeaveRequest.objects.all()

    year = request.query_params.get("year", today.year)

    try:
        year = int(year)
        if year < 1900 or year > 9999:
            raise ValueError
    except (ValueError, TypeError):
        return bad_request("Invalid year.")

    queryset = queryset.filter(start_date__year=year)

    stats = queryset.aggregate(
        total=Count("id"),

        pending=Count(
            "id",
            filter=Q(status=LeaveRequest.LeaveStatus.PENDING)
        ),

        approved=Count(
            "id",
            filter=Q(status=LeaveRequest.LeaveStatus.APPROVED)
        ),

        rejected=Count(
            "id",
            filter=Q(status=LeaveRequest.LeaveStatus.REJECTED)
        ),

        cancelled=Count(
            "id",
            filter=Q(status=LeaveRequest.LeaveStatus.CANCELLED)
        ),

        approved_days=Sum(
            "days_requested",
            filter=Q(status=LeaveRequest.LeaveStatus.APPROVED)
        ),

        pending_days=Sum(
            "days_requested",
            filter=Q(status=LeaveRequest.LeaveStatus.PENDING)
        ),
    )

    by_leave_type = list(
        queryset.values("leave_type__name")
        .annotate(
            total_requests=Count("id"),
            approved=Count(
                "id",
                filter=Q(status=LeaveRequest.LeaveStatus.APPROVED)
            ),
            pending=Count(
                "id",
                filter=Q(status=LeaveRequest.LeaveStatus.PENDING)
            ),
            rejected=Count(
                "id",
                filter=Q(status=LeaveRequest.LeaveStatus.REJECTED)
            ),
        )
        .order_by("leave_type__name")
    )

    by_department = list(
        queryset.values("employee__department__name")
        .annotate(
            total_requests=Count("id"),
            approved=Count(
                "id",
                filter=Q(status=LeaveRequest.LeaveStatus.APPROVED)
            ),
            pending=Count(
                "id",
                filter=Q(status=LeaveRequest.LeaveStatus.PENDING)
            ),
        )
        .order_by("employee__department__name")
    )

    return Response({
        "year": year,
        "summary": {
            "total_requests": stats["total"],
            "pending_requests": stats["pending"],
            "approved_requests": stats["approved"],
            "rejected_requests": stats["rejected"],
            "cancelled_requests": stats["cancelled"],
            "approved_days": str(
                stats["approved_days"] or Decimal("0")
            ),
            "pending_days": str(
                stats["pending_days"] or Decimal("0")
            ),
        },
        "by_leave_type": [
            {
                "leave_type": row["leave_type__name"],
                "total_requests": row["total_requests"],
                "approved": row["approved"],
                "pending": row["pending"],
                "rejected": row["rejected"],
            }
            for row in by_leave_type
        ],
        "by_department": [
            {
                "department": row["employee__department__name"],
                "total_requests": row["total_requests"],
                "approved": row["approved"],
                "pending": row["pending"],
            }
            for row in by_department
        ],
    })


# ============================================================
# 12. LEAVE REPORT
# ============================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def leave_report(request):
    """
    Supported query parameters:

    ?year=2026
    ?department=<UUID>
    ?employee=<UUID>
    ?status=APPROVED
    ?export=csv
    """

    params = request.query_params

    year = params.get("year", timezone.localdate().year)

    try:
        year = int(year)
        if year < 1900 or year > 9999:
            raise ValueError
    except (ValueError, TypeError):
        return bad_request("Year must be a valid four-digit year.")

    queryset = LeaveRequest.objects.filter(
        start_date__year=year
    ).select_related(
        "employee",
        "employee__department",
        "leave_type",
        "reviewed_by"
    )

    try:
        employee_id = parse_uuid(
            params.get("employee"),
            "employee"
        )

        department_id = parse_uuid(
            params.get("department"),
            "department"
        )

    except ValueError as exc:
        return bad_request(str(exc))

    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)

    if department_id:
        queryset = queryset.filter(
            employee__department_id=department_id
        )

    leave_status = params.get("status")

    if leave_status:
        leave_status = leave_status.upper()

        if leave_status not in LeaveRequest.LeaveStatus.values:
            return bad_request("Invalid leave status.")

        queryset = queryset.filter(status=leave_status)

    rows = queryset.values(
        "employee__employee_number",
        "employee__first_name",
        "employee__middle_name",
        "employee__last_name",
        "employee__department__name",
        "leave_type__name",
        "start_date",
        "end_date",
        "days_requested",
        "status",
        "reason",
        "reviewed_by__username",
        "created_at",
    ).order_by(
        "employee__first_name",
        "employee__last_name",
        "start_date"
    )

    def build_row(row):

        full_name = " ".join(
            p for p in [
                row["employee__first_name"],
                row["employee__middle_name"],
                row["employee__last_name"],
            ] if p
        )

        return {
            "employee_number": row["employee__employee_number"],
            "employee_name": full_name,
            "department": row["employee__department__name"],
            "leave_type": row["leave_type__name"],
            "start_date": row["start_date"].isoformat(),
            "end_date": row["end_date"].isoformat(),
            "days_requested": str(row["days_requested"]),
            "status": row["status"],
            "reason": row["reason"],
            "reviewed_by": row["reviewed_by__username"],
            "submitted_at": row["created_at"].isoformat(),
        }

    # CSV EXPORT

    if params.get("export") == "csv":

        response = HttpResponse(content_type="text/csv")

        response["Content-Disposition"] = (
            f'attachment; filename="leave_report_{year}.csv"'
        )

        writer = csv.writer(response)

        writer.writerow([
            "Employee Number",
            "Employee Name",
            "Department",
            "Leave Type",
            "Start Date",
            "End Date",
            "Days Requested",
            "Status",
            "Reason",
            "Reviewed By",
            "Submitted At",
        ])

        for row in rows.iterator():

            data = build_row(row)

            writer.writerow([
                csv_safe(data["employee_number"]),
                csv_safe(data["employee_name"]),
                csv_safe(data["department"]),
                csv_safe(data["leave_type"]),
                data["start_date"],
                data["end_date"],
                data["days_requested"],
                data["status"],
                csv_safe(data["reason"]),
                csv_safe(data["reviewed_by"]),
                data["submitted_at"],
            ])

        log_action(
            request,
            AuditLog.Action.EXPORT,
            "LeaveRequest",
            description=f"Leave report for {year} exported to CSV."
        )

        return response

    # PAGINATED JSON RESPONSE

    paginator = LeavePagination()

    page = paginator.paginate_queryset(rows, request)

    return paginator.get_paginated_response([
        build_row(row) for row in page
    ])
