import csv
import uuid
from datetime import date, datetime, timedelta

from django.db import IntegrityError, transaction
from django.db.models import (
    Count,
    DurationField,
    ExpressionWrapper,
    F,
    Q,
    Sum,
)
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from core.models import Attendance, AuditLog, Employee, SystemSetting
from core.views import log_action  # shared audit helper

from attendance.serializers import (
    AttendanceSerializer,
    BulkAttendanceSerializer,
    CheckInSerializer,
    CheckOutSerializer,
)

AttendanceStatus = Attendance.AttendanceStatus
EmploymentStatus = Employee.EmploymentStatus


# =====================================================
# HELPERS
# =====================================================

class AttendancePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class BadParam(Exception):
    """Raised for an invalid query parameter; turned into a 400 response."""


def parse_date_param(params, name):
    raw = params.get(name)
    if not raw:
        return None
    value = parse_date(raw)
    if value is None:
        raise BadParam(f"'{name}' must be a valid date in YYYY-MM-DD format.")
    return value


def parse_uuid_param(params, name):
    raw = params.get(name)
    if not raw:
        return None
    try:
        return uuid.UUID(raw)
    except ValueError:
        raise BadParam(f"'{name}' must be a valid UUID.")


ALLOWED_ORDERING = {
    "attendance_date", "-attendance_date",
    "employee__first_name", "-employee__first_name",
    "status", "-status",
    "check_in", "-check_in",
}


def filtered_attendance(params):
    """
    Supported filters: employee, department, status, date, start_date,
    end_date, search, ordering.
    """
    qs = Attendance.objects.select_related("employee", "employee__department")

    employee_id = parse_uuid_param(params, "employee")
    if employee_id:
        qs = qs.filter(employee_id=employee_id)

    department_id = parse_uuid_param(params, "department")
    if department_id:
        qs = qs.filter(employee__department_id=department_id)

    status_value = params.get("status")
    if status_value:
        status_value = status_value.upper()
        if status_value not in AttendanceStatus.values:
            raise BadParam(f"'status' must be one of: {', '.join(AttendanceStatus.values)}.")
        qs = qs.filter(status=status_value)

    exact = parse_date_param(params, "date")
    start = parse_date_param(params, "start_date")
    end = parse_date_param(params, "end_date")

    if exact:
        qs = qs.filter(attendance_date=exact)
    if start:
        qs = qs.filter(attendance_date__gte=start)
    if end:
        qs = qs.filter(attendance_date__lte=end)
    if start and end and end < start:
        raise BadParam("'end_date' cannot be earlier than 'start_date'.")

    search = (params.get("search") or "").strip()
    if search:
        qs = qs.filter(
            Q(employee__first_name__icontains=search)
            | Q(employee__last_name__icontains=search)
            | Q(employee__employee_number__icontains=search)
        )

    ordering = params.get("ordering")
    if ordering:
        if ordering not in ALLOWED_ORDERING:
            raise BadParam(f"'ordering' must be one of: {', '.join(sorted(ALLOWED_ORDERING))}.")
        qs = qs.order_by(ordering, "pk")
    else:
        qs = qs.order_by("-attendance_date", "employee__first_name", "pk")

    return qs


def bad_request(message):
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


def get_work_rules():
    """
    Work rules come from the SystemSetting with key 'attendance_rules', e.g.
    {"work_start_time": "08:00", "grace_minutes": 15, "half_day_hours": 4}
    Missing or invalid values fall back to the defaults below.
    """
    rules = {"work_start_time": "08:00", "grace_minutes": 15, "half_day_hours": 4}

    setting = SystemSetting.objects.filter(key="attendance_rules").first()
    if setting and isinstance(setting.value, dict):
        for key in rules:
            if key in setting.value:
                rules[key] = setting.value[key]

    try:
        start = datetime.strptime(str(rules["work_start_time"]), "%H:%M").time()
    except ValueError:
        start = datetime.strptime("08:00", "%H:%M").time()

    try:
        grace = max(int(rules["grace_minutes"]), 0)
    except (TypeError, ValueError):
        grace = 15

    try:
        half_day_hours = max(float(rules["half_day_hours"]), 0)
    except (TypeError, ValueError):
        half_day_hours = 4.0

    late_after = (datetime.combine(date.today(), start) + timedelta(minutes=grace)).time()

    return {"late_after": late_after, "half_day_hours": half_day_hours}


def csv_safe(value):
    """Prevent spreadsheet formula injection in exported cells."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


def attendance_rate(present, late, half_day, absent, on_leave=0):
    """Share of working (non-leave) days the employee attended."""
    attended = present + late + half_day
    working = attended + absent
    return round(attended / working * 100, 2) if working else 0.0


# =====================================================
# LIST + CREATE
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def attendance_list_create(request):

    if request.method == "GET":
        try:
            queryset = filtered_attendance(request.query_params)
        except BadParam as exc:
            return bad_request(str(exc))

        paginator = AttendancePagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AttendanceSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    serializer = AttendanceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            record = serializer.save()
    except IntegrityError:
        return bad_request("An attendance record already exists for this employee on this date.")

    log_action(
        request,
        AuditLog.Action.CREATE,
        "Attendance",
        object_id=record.pk,
        description=(
            f"Attendance {record.status} recorded for "
            f"{record.employee.employee_number} on {record.attendance_date}"
        ),
    )

    return Response(AttendanceSerializer(record).data, status=status.HTTP_201_CREATED)


# =====================================================
# RETRIEVE + UPDATE + DELETE
# =====================================================

@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def attendance_detail(request, pk):

    record = get_object_or_404(
        Attendance.objects.select_related("employee", "employee__department"),
        pk=pk,
    )

    if request.method == "GET":
        return Response(AttendanceSerializer(record).data)

    if request.method == "DELETE":
        description = (
            f"Attendance for {record.employee.employee_number} "
            f"on {record.attendance_date} deleted"
        )
        record_id = record.pk
        record.delete()

        log_action(
            request,
            AuditLog.Action.DELETE,
            "Attendance",
            object_id=record_id,
            description=description,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = AttendanceSerializer(
        record, data=request.data, partial=(request.method == "PATCH")
    )
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            record = serializer.save()
    except IntegrityError:
        return bad_request("An attendance record already exists for this employee on this date.")

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Attendance",
        object_id=record.pk,
        description=(
            f"Attendance for {record.employee.employee_number} on "
            f"{record.attendance_date} updated "
            f"(fields: {', '.join(sorted(serializer.validated_data)) or 'none'})"
        ),
    )

    return Response(AttendanceSerializer(record).data)


# =====================================================
# CHECK-IN
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def check_in(request):

    serializer = CheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    employee = serializer.validated_data["employee"]
    remarks = serializer.validated_data.get("remarks", "")

    if employee.employment_status != EmploymentStatus.ACTIVE:
        return bad_request("Only active employees can check in.")

    now = timezone.now()
    local_now = timezone.localtime(now)
    today = local_now.date()

    rules = get_work_rules()
    new_status = (
        AttendanceStatus.LATE
        if local_now.time() > rules["late_after"]
        else AttendanceStatus.PRESENT
    )

    with transaction.atomic():
        record, created = Attendance.objects.select_for_update().get_or_create(
            employee=employee,
            attendance_date=today,
            defaults={"check_in": now, "status": new_status, "remarks": remarks},
        )

        if not created:
            if record.check_in:
                return bad_request("This employee has already checked in today.")
            if record.status == AttendanceStatus.ON_LEAVE:
                return bad_request("This employee is marked as on leave today.")

            # A record exists (e.g. pre-marked absent) but no check-in yet.
            record.check_in = now
            record.status = new_status
            if remarks:
                record.remarks = remarks
            record.save()

    log_action(
        request,
        AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE,
        "Attendance",
        object_id=record.pk,
        description=f"{employee.employee_number} checked in ({new_status})",
    )

    record = Attendance.objects.select_related("employee", "employee__department").get(pk=record.pk)

    return Response(
        {"message": "Check-in recorded.", "attendance": AttendanceSerializer(record).data},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


# =====================================================
# CHECK-OUT
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def check_out(request):

    serializer = CheckOutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    employee = serializer.validated_data["employee"]
    remarks = serializer.validated_data.get("remarks", "")

    now = timezone.now()
    rules = get_work_rules()

    with transaction.atomic():
        # Latest open check-in within 24h, so overnight shifts also work.
        record = (
            Attendance.objects.select_for_update()
            .filter(
                employee=employee,
                check_in__isnull=False,
                check_out__isnull=True,
                check_in__gte=now - timedelta(hours=24),
            )
            .order_by("-check_in")
            .first()
        )

        if record is None:
            return bad_request("No open check-in found for this employee in the last 24 hours.")

        record.check_out = now

        hours = (now - record.check_in).total_seconds() / 3600
        if hours < rules["half_day_hours"] and record.status in (
            AttendanceStatus.PRESENT,
            AttendanceStatus.LATE,
        ):
            record.status = AttendanceStatus.HALF_DAY

        if remarks:
            record.remarks = remarks

        record.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Attendance",
        object_id=record.pk,
        description=f"{employee.employee_number} checked out ({round(hours, 2)}h, {record.status})",
    )

    record = Attendance.objects.select_related("employee", "employee__department").get(pk=record.pk)

    return Response(
        {"message": "Check-out recorded.", "attendance": AttendanceSerializer(record).data},
        status=status.HTTP_200_OK,
    )


# =====================================================
# BULK MARK
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def bulk_mark_attendance(request):
    """
    {
      "attendance_date": "2026-11-06",          // optional, defaults to today
      "records": [
        {"employee": "<uuid>", "status": "PRESENT", "remarks": ""},
        {"employee": "<uuid>", "status": "ABSENT"}
      ]
    }
    Existing records for that date are updated; missing ones are created.
    """

    serializer = BulkAttendanceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    attendance_date = data.get("attendance_date") or timezone.localdate()
    items = data["records"]

    existing = {
        record.employee_id: record
        for record in Attendance.objects.filter(
            attendance_date=attendance_date,
            employee_id__in=[item["employee"] for item in items],
        )
    }

    now = timezone.now()
    to_create, to_update = [], []

    for item in items:
        record = existing.get(item["employee"])
        remarks = item.get("remarks", "")

        if record:
            record.status = item["status"]
            if "remarks" in item:
                record.remarks = remarks
            record.updated_at = now  # bulk_update does not trigger auto_now
            to_update.append(record)
        else:
            to_create.append(
                Attendance(
                    employee_id=item["employee"],
                    attendance_date=attendance_date,
                    status=item["status"],
                    remarks=remarks,
                )
            )

    try:
        with transaction.atomic():
            Attendance.objects.bulk_create(to_create)
            Attendance.objects.bulk_update(to_update, ["status", "remarks", "updated_at"])
    except IntegrityError:
        return Response(
            {"error": "Attendance was modified by someone else while saving. Please retry."},
            status=status.HTTP_409_CONFLICT,
        )

    log_action(
        request,
        AuditLog.Action.CREATE,
        "Attendance",
        description=(
            f"Bulk attendance for {attendance_date}: "
            f"{len(to_create)} created, {len(to_update)} updated"
        ),
    )

    return Response(
        {
            "message": "Attendance saved.",
            "attendance_date": attendance_date.isoformat(),
            "created": len(to_create),
            "updated": len(to_update),
        },
        status=status.HTTP_200_OK,
    )


# =====================================================
# DAILY SUMMARY
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def attendance_summary(request):

    try:
        day = parse_date_param(request.query_params, "date") or timezone.localdate()
    except BadParam as exc:
        return bad_request(str(exc))

    expected = Employee.objects.filter(
        employment_status__in=[EmploymentStatus.ACTIVE, EmploymentStatus.ON_LEAVE]
    ).count()

    counts = {
        "present": Count("pk", filter=Q(status=AttendanceStatus.PRESENT)),
        "absent": Count("pk", filter=Q(status=AttendanceStatus.ABSENT)),
        "late": Count("pk", filter=Q(status=AttendanceStatus.LATE)),
        "half_day": Count("pk", filter=Q(status=AttendanceStatus.HALF_DAY)),
        "on_leave": Count("pk", filter=Q(status=AttendanceStatus.ON_LEAVE)),
    }

    day_records = Attendance.objects.filter(attendance_date=day)

    stats = day_records.aggregate(marked=Count("pk"), **counts)

    by_department = list(
        day_records.values("employee__department_id", "employee__department__name")
        .annotate(total=Count("pk"), **counts)
        .order_by("employee__department__name")
    )

    return Response(
        {
            "date": day.isoformat(),
            "expected_employees": expected,
            "marked": stats["marked"],
            "not_marked": max(expected - stats["marked"], 0),
            "present": stats["present"],
            "absent": stats["absent"],
            "late": stats["late"],
            "half_day": stats["half_day"],
            "on_leave": stats["on_leave"],
            "attendance_rate": attendance_rate(
                stats["present"], stats["late"], stats["half_day"], stats["absent"]
            ),
            "by_department": [
                {
                    "department_id": str(row["employee__department_id"]),
                    "department": row["employee__department__name"],
                    "total": row["total"],
                    "present": row["present"],
                    "absent": row["absent"],
                    "late": row["late"],
                    "half_day": row["half_day"],
                    "on_leave": row["on_leave"],
                }
                for row in by_department
            ],
        }
    )


# =====================================================
# MONTHLY REPORT  (JSON, or CSV with ?export=csv)
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def attendance_report(request):
    """
    ?month=YYYY-MM  (default: current month)
    ?department=<uuid>   ?employee=<uuid>   ?export=csv
    """

    params = request.query_params

    month_raw = params.get("month")
    if month_raw:
        try:
            month_start = datetime.strptime(month_raw, "%Y-%m").date()
        except ValueError:
            return bad_request("'month' must be in YYYY-MM format.")
    else:
        month_start = timezone.localdate().replace(day=1)

    next_month_start = (month_start + timedelta(days=32)).replace(day=1)

    try:
        department_id = parse_uuid_param(params, "department")
        employee_id = parse_uuid_param(params, "employee")
    except BadParam as exc:
        return bad_request(str(exc))

    records = Attendance.objects.filter(
        attendance_date__gte=month_start,
        attendance_date__lt=next_month_start,
    )
    if department_id:
        records = records.filter(employee__department_id=department_id)
    if employee_id:
        records = records.filter(employee_id=employee_id)

    worked = ExpressionWrapper(F("check_out") - F("check_in"), output_field=DurationField())

    rows_qs = (
        records.values(
            "employee_id",
            "employee__employee_number",
            "employee__first_name",
            "employee__middle_name",
            "employee__last_name",
            "employee__department__name",
        )
        .annotate(
            records=Count("pk"),
            present=Count("pk", filter=Q(status=AttendanceStatus.PRESENT)),
            absent=Count("pk", filter=Q(status=AttendanceStatus.ABSENT)),
            late=Count("pk", filter=Q(status=AttendanceStatus.LATE)),
            half_day=Count("pk", filter=Q(status=AttendanceStatus.HALF_DAY)),
            on_leave=Count("pk", filter=Q(status=AttendanceStatus.ON_LEAVE)),
            total_worked=Sum(
                worked,
                filter=Q(check_in__isnull=False, check_out__isnull=False),
            ),
        )
        .order_by("employee__first_name", "employee__last_name", "employee_id")
    )

    def build_row(row):
        name = " ".join(
            p for p in [
                row["employee__first_name"],
                row["employee__middle_name"],
                row["employee__last_name"],
            ] if p
        )
        total_worked = row["total_worked"]
        return {
            "employee_id": str(row["employee_id"]),
            "employee_number": row["employee__employee_number"],
            "employee_name": name,
            "department": row["employee__department__name"],
            "records": row["records"],
            "present": row["present"],
            "late": row["late"],
            "half_day": row["half_day"],
            "absent": row["absent"],
            "on_leave": row["on_leave"],
            "hours_worked": round(total_worked.total_seconds() / 3600, 2) if total_worked else 0,
            "attendance_rate": attendance_rate(
                row["present"], row["late"], row["half_day"], row["absent"]
            ),
        }

    month_label = month_start.strftime("%Y-%m")

    if params.get("export") == "csv":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="attendance_report_{month_label}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Employee Number", "Employee Name", "Department", "Records",
            "Present", "Late", "Half Day", "Absent", "On Leave",
            "Hours Worked", "Attendance Rate (%)",
        ])
        for row in rows_qs.iterator():
            r = build_row(row)
            writer.writerow([
                csv_safe(r["employee_number"]),
                csv_safe(r["employee_name"]),
                csv_safe(r["department"]),
                r["records"], r["present"], r["late"], r["half_day"],
                r["absent"], r["on_leave"], r["hours_worked"], r["attendance_rate"],
            ])

        log_action(
            request,
            AuditLog.Action.EXPORT,
            "Attendance",
            description=f"Attendance report {month_label} exported to CSV",
        )
        return response

    paginator = AttendancePagination()
    page = paginator.paginate_queryset(rows_qs, request)
    response = paginator.get_paginated_response([build_row(row) for row in page])
    response.data["month"] = month_label
    response.data["period_start"] = month_start.isoformat()
    response.data["period_end"] = (next_month_start - timedelta(days=1)).isoformat()
    return response