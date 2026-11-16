import csv

from django.http import HttpResponse
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from core.models import AuditLog
from core.utils import BadParam, StandardPagination, csv_safe, log_action, parse_uuid_param

from . import services
from reports.params import (
    parse_choice_param,
    parse_decimal_param,
    parse_int_param,
    parse_month_range,
    parse_period,
    parse_year,
)


# =====================================================
# HELPERS
# =====================================================

def bad_request(message):
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


def csv_response(request, name, headers, rows):
    """Streams a CSV (formula-injection safe) and records the export in the audit log."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{name}-{timezone.localdate():%Y%m%d}.csv"'

    writer = csv.writer(response)
    writer.writerow(headers)

    count = 0
    for row in rows:
        writer.writerow([csv_safe(cell) if isinstance(cell, str) else cell for cell in row])
        count += 1

    log_action(
        request,
        AuditLog.Action.EXPORT,
        "Report",
        description=f"Report '{name}' exported to CSV ({count} row(s))",
    )
    return response


def deliver(request, name, data, table_builder):
    if request.query_params.get("export") == "csv":
        if table_builder is None:
            return bad_request("This report has no CSV export.")
        headers, rows = table_builder()
        return csv_response(request, name, headers, rows)
    return Response(data)


def run(request, name, service, parse):
    """parse(query_params) -> keyword arguments for the service; BadParam -> 400."""
    try:
        kwargs = parse(request.query_params)
    except BadParam as exc:
        return bad_request(str(exc))

    data, table_builder = service(**kwargs)
    return deliver(request, name, data, table_builder)


def department_param(params):
    return parse_uuid_param(params, "department")


# =====================================================
# CATALOGUE
# =====================================================

REPORT_CATALOGUE = [
    {
        "name": "Headcount",
        "url_name": "headcount",
        "description": "Current staff by department, position, gender, age band and tenure band.",
        "params": ["department"],
        "csv": True,
    },
    {
        "name": "Turnover",
        "url_name": "turnover",
        "description": "Hires, terminations and turnover rate with a monthly breakdown.",
        "params": ["from", "to", "department"],
        "csv": True,
    },
    {
        "name": "Upcoming birthdays and anniversaries",
        "url_name": "upcoming-events",
        "description": "Birthdays and work anniversaries in the next N days.",
        "params": ["days", "department"],
        "csv": True,
    },
    {
        "name": "Attendance",
        "url_name": "attendance",
        "description": "Attendance totals, department comparison, daily trend, most absent and most late.",
        "params": ["from", "to", "department"],
        "csv": True,
    },
    {
        "name": "Leave usage",
        "url_name": "leave",
        "description": "Leave taken by type, department and month; who is on leave today.",
        "params": ["from", "to", "department"],
        "csv": True,
    },
    {
        "name": "Leave balances",
        "url_name": "leave-balances",
        "description": "Allocated, used and remaining leave per employee, with low-balance alerts.",
        "params": ["year", "department", "leave_type", "low_threshold"],
        "csv": True,
    },
    {
        "name": "Payroll cost",
        "url_name": "payroll-cost",
        "description": "Salary cost by month, department and status, per currency.",
        "params": ["from_month", "to_month", "department", "breakdown (csv: month|department)"],
        "csv": True,
    },
    {
        "name": "Audit activity",
        "url_name": "audit",
        "description": "Who did what: events by action, user, model and day, plus a paginated log.",
        "params": ["from", "to", "user", "action", "model"],
        "csv": True,
    },
]


@api_view(["GET"])
@permission_classes([IsAdminUser])
def report_catalogue(request):
    """List of available reports. Add ?export=csv to any report that supports it."""
    return Response(
        [
            {
                "name": r["name"],
                "url": request.build_absolute_uri(reverse(f"reports:{r['url_name']}")),
                "description": r["description"],
                "params": r["params"],
                "csv": r["csv"],
            }
            for r in REPORT_CATALOGUE
        ]
    )


# =====================================================
# EMPLOYEE REPORTS
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def headcount(request):
    return run(
        request, "headcount", services.headcount_report,
        lambda p: {"department_id": department_param(p)},
    )


def _parse_turnover(p):
    start, end = parse_period(p, default="year")
    return {"start": start, "end": end, "department_id": department_param(p)}


@api_view(["GET"])
@permission_classes([IsAdminUser])
def turnover(request):
    return run(request, "turnover", services.turnover_report, _parse_turnover)


def _parse_upcoming(p):
    return {
        "days": parse_int_param(p, "days", default=30, minimum=1, maximum=365),
        "department_id": department_param(p),
    }


@api_view(["GET"])
@permission_classes([IsAdminUser])
def upcoming_events(request):
    return run(request, "upcoming-events", services.upcoming_events_report, _parse_upcoming)


# =====================================================
# ATTENDANCE REPORT
# =====================================================

def _parse_attendance(p):
    start, end = parse_period(p, default="month")
    return {"start": start, "end": end, "department_id": department_param(p)}


@api_view(["GET"])
@permission_classes([IsAdminUser])
def attendance(request):
    return run(request, "attendance", services.attendance_report, _parse_attendance)


# =====================================================
# LEAVE REPORTS
# =====================================================

def _parse_leave(p):
    start, end = parse_period(p, default="year")
    return {"start": start, "end": end, "department_id": department_param(p)}


@api_view(["GET"])
@permission_classes([IsAdminUser])
def leave(request):
    return run(request, "leave", services.leave_report, _parse_leave)


def _parse_balances(p):
    return {
        "year": parse_year(p),
        "department_id": department_param(p),
        "leave_type_id": parse_uuid_param(p, "leave_type"),
        "low_threshold": parse_decimal_param(p, "low_threshold", default=services.Decimal("3")),
    }


@api_view(["GET"])
@permission_classes([IsAdminUser])
def leave_balances(request):
    return run(request, "leave-balances", services.leave_balances_report, _parse_balances)


# =====================================================
# PAYROLL REPORT
# =====================================================

def _parse_payroll_cost(p):
    from_month, end_exclusive = parse_month_range(p)
    return {
        "from_month": from_month,
        "end_exclusive": end_exclusive,
        "department_id": department_param(p),
        "breakdown": parse_choice_param(p, "breakdown", ("month", "department"), default="month"),
    }


@api_view(["GET"])
@permission_classes([IsAdminUser])
def payroll_cost(request):
    return run(request, "payroll-cost", services.payroll_cost_report, _parse_payroll_cost)


# =====================================================
# AUDIT REPORT  (summary + paginated entries)
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def audit(request):
    params = request.query_params

    try:
        start, end = parse_period(params, default="month")
        user_id = parse_int_param(params, "user")
        action = parse_choice_param(params, "action", AuditLog.Action.values, upper=True)
        model_name = (params.get("model") or "").strip()[:100] or None
    except BadParam as exc:
        return bad_request(str(exc))

    summary, table_builder, entries = services.audit_report(start, end, user_id, action, model_name)

    if params.get("export") == "csv":
        headers, rows = table_builder()
        return csv_response(request, "audit", headers, rows)

    paginator = StandardPagination()
    page = paginator.paginate_queryset(entries, request)
    response = paginator.get_paginated_response(
        [
            {
                "id": str(e.pk),
                "time": e.created_at.isoformat(),
                "user": e.user.username if e.user_id else None,
                "action": e.action,
                "model_name": e.model_name,
                "object_id": e.object_id,
                "description": e.description,
                "ip_address": e.ip_address,
            }
            for e in page
        ]
    )
    response.data["summary"] = summary
    return response