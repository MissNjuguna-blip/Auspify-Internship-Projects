import csv
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import IntegrityError, transaction
from django.db.models import Count, F, Q, Sum, TextField, Value
from django.db.models.deletion import ProtectedError
from django.db.models.functions import Concat, TruncMonth
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from core.models import (
    AuditLog,
    Employee,
    LeaveRequest,
    Payroll,
    SalaryStructure,
)
from core.utils import (
    BadParam,
    StandardPagination,
    csv_safe,
    log_action,
    parse_uuid_param,
)

from .serializers import (
    BulkActionSerializer,
    CancelSerializer,
    GeneratePayrollSerializer,
    PayrollAdjustSerializer,
    PayrollSerializer,
    PaySerializer,
    SalaryStructureSerializer,
)

PayrollStatus = Payroll.PayrollStatus
EmploymentStatus = Employee.EmploymentStatus

ZERO = Decimal("0.00")
CENT = Decimal("0.01")
PREVIEW_LIMIT = 200
SKIPPED_LIMIT = 100


# =====================================================
# HELPERS
# =====================================================

def bad_request(message):
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


def conflict(message):
    return Response({"error": message}, status=status.HTTP_409_CONFLICT)


def money(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def money_str(value):
    return str(money(value or ZERO))


def parse_date_param(params, name):
    raw = params.get(name)
    if not raw:
        return None
    value = parse_date(raw)
    if value is None:
        raise BadParam(f"'{name}' must be a valid date in YYYY-MM-DD format.")
    return value


def parse_month_param(params):
    """?month=YYYY-MM -> (first day, first day of next month, 'YYYY-MM')."""
    raw = params.get("month")
    if raw:
        try:
            start = datetime.strptime(raw, "%Y-%m").date()
        except ValueError:
            raise BadParam("'month' must be in YYYY-MM format.")
    else:
        start = timezone.localdate().replace(day=1)
    next_start = (start + timedelta(days=32)).replace(day=1)
    return start, next_start, start.strftime("%Y-%m")


def last_n_months(today, n):
    """First day of each of the last n calendar months, oldest first."""
    months = []
    year, month = today.year, today.month
    for _ in range(n):
        months.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    months.reverse()
    return months


def count_weekdays(start, end):
    return sum(
        1
        for offset in range((end - start).days + 1)
        if (start + timedelta(days=offset)).weekday() < 5
    )


def changed_fields(serializer):
    return ", ".join(sorted(serializer.validated_data)) or "none"


# =====================================================
# SALARY STRUCTURES
# =====================================================

STRUCTURE_ORDERING = {
    "effective_from", "-effective_from", "basic_salary", "-basic_salary",
    "created_at", "-created_at", "employee__first_name", "-employee__first_name",
}


def filtered_structures(params):
    """Filters: employee, department, is_active, search, ordering."""
    queryset = SalaryStructure.objects.select_related("employee", "employee__department")

    employee_id = parse_uuid_param(params, "employee")
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)

    department_id = parse_uuid_param(params, "department")
    if department_id:
        queryset = queryset.filter(employee__department_id=department_id)

    is_active = params.get("is_active")
    if is_active not in (None, ""):
        if is_active.lower() not in ("true", "false"):
            raise BadParam("'is_active' must be true or false.")
        queryset = queryset.filter(is_active=is_active.lower() == "true")

    for term in (params.get("search") or "").split()[:5]:
        queryset = queryset.filter(
            Q(employee__first_name__icontains=term)
            | Q(employee__last_name__icontains=term)
            | Q(employee__employee_number__icontains=term)
        )

    ordering = params.get("ordering")
    if ordering:
        if ordering not in STRUCTURE_ORDERING:
            raise BadParam(f"'ordering' must be one of: {', '.join(sorted(STRUCTURE_ORDERING))}.")
        return queryset.order_by(ordering, "pk")
    return queryset.order_by("employee__first_name", "-effective_from", "pk")


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def structure_list_create(request):

    if request.method == "GET":
        try:
            queryset = filtered_structures(request.query_params)
        except BadParam as exc:
            return bad_request(str(exc))

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(SalaryStructureSerializer(page, many=True).data)

    serializer = SalaryStructureSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    employee = serializer.validated_data["employee"]
    effective_from = serializer.validated_data["effective_from"]
    is_active = serializer.validated_data.get("is_active", True)

    try:
        with transaction.atomic():
            # serialise concurrent salary changes for the same employee
            Employee.objects.select_for_update().get(pk=employee.pk)

            if is_active:
                # a salary revision closes the structure it replaces
                previous = SalaryStructure.objects.filter(employee=employee, is_active=True).first()
                if previous:
                    last_day = effective_from - timedelta(days=1)
                    previous.is_active = False
                    if previous.effective_to is None or previous.effective_to > last_day:
                        previous.effective_to = last_day
                    previous.save(update_fields=["is_active", "effective_to", "updated_at"])

            structure = serializer.save()
    except IntegrityError:
        return conflict("Could not save the salary structure because of a conflicting update. Please retry.")

    log_action(
        request,
        AuditLog.Action.CREATE,
        "SalaryStructure",
        object_id=structure.pk,
        description=(
            f"Salary structure created for {employee.employee_number} "
            f"effective {structure.effective_from}"
        ),
    )

    structure = SalaryStructure.objects.select_related("employee", "employee__department").get(pk=structure.pk)
    return Response(SalaryStructureSerializer(structure).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def structure_detail(request, pk):

    structure = get_object_or_404(
        SalaryStructure.objects.select_related("employee", "employee__department"), pk=pk
    )

    if request.method == "GET":
        return Response(SalaryStructureSerializer(structure).data)

    if request.method == "DELETE":
        if structure.payroll_records.exists():
            return conflict(
                "Cannot delete: payroll records were produced from this salary structure."
            )

        label = f"{structure.employee.employee_number} effective {structure.effective_from}"
        structure_id = structure.pk

        try:
            structure.delete()
        except ProtectedError:
            return conflict("Cannot delete: this salary structure is referenced by other records.")

        log_action(
            request,
            AuditLog.Action.DELETE,
            "SalaryStructure",
            object_id=structure_id,
            description=f"Salary structure deleted ({label})",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = SalaryStructureSerializer(
        structure, data=request.data, partial=(request.method == "PATCH")
    )
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            structure = serializer.save()
    except IntegrityError:
        return conflict("Could not save the salary structure because of a conflicting update. Please retry.")

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "SalaryStructure",
        object_id=structure.pk,
        description=(
            f"Salary structure for {structure.employee.employee_number} updated "
            f"(fields: {changed_fields(serializer)})"
        ),
    )

    return Response(SalaryStructureSerializer(structure).data)


# =====================================================
# PAYROLL GENERATION
# =====================================================

def eligibility_reason(employee, start, end):
    """Why an employee gets no payroll for the period (None = eligible)."""
    if employee.date_joined > end:
        return "Joined after the pay period."
    if employee.termination_date and employee.termination_date < start:
        return "Terminated before the pay period."
    if employee.employment_status == EmploymentStatus.INACTIVE:
        return "Employee is inactive."
    return None


def compute_amounts(employee, structure, start, end, total_days, period_weekdays, leaves):
    """
    - Pay is prorated by calendar days when the employee joined or left mid-period.
    - Approved UNPAID leave is deducted at (basic + allowances) / weekdays in the period.
    - The structure's `deductions` are a fixed amount (no tax tables are applied here).
    """
    employed_start = max(start, employee.date_joined)
    employed_end = min(end, employee.termination_date) if employee.termination_date else end
    days_employed = (employed_end - employed_start).days + 1

    factor = Decimal(days_employed) / Decimal(total_days)

    basic = money(structure.basic_salary * factor)
    allowances = money(structure.allowances * factor)
    deductions = money(structure.deductions * factor)
    gross = basic + allowances

    remarks = []
    if days_employed != total_days:
        remarks.append(f"Prorated for {days_employed}/{total_days} days.")

    unpaid_days = Decimal("0")
    for leave_start, leave_end, days_requested in leaves:
        overlap_start = max(leave_start, employed_start)
        overlap_end = min(leave_end, employed_end)
        if overlap_end < overlap_start:
            continue
        span = (leave_end - leave_start).days + 1
        overlap = (overlap_end - overlap_start).days + 1
        unpaid_days += Decimal(days_requested) * Decimal(overlap) / Decimal(span)

    if unpaid_days > 0 and period_weekdays:
        daily_rate = (structure.basic_salary + structure.allowances) / Decimal(period_weekdays)
        leave_deduction = money(daily_rate * unpaid_days)
        leave_deduction = max(ZERO, min(leave_deduction, gross - deductions))
        deductions += leave_deduction
        remarks.append(f"Unpaid leave: {money(unpaid_days)} day(s), {leave_deduction} deducted.")

    deductions = min(deductions, gross)

    return {
        "basic_salary": basic,
        "allowances": allowances,
        "deductions": deductions,
        "gross_salary": gross,
        "net_salary": gross - deductions,
        "remarks": " ".join(remarks),
    }


def build_payroll_rows(start, end, employee_ids, department_id, deduct_unpaid_leave):
    """Calculates (but does not save) payroll rows. Returns (rows, skipped)."""

    total_days = (end - start).days + 1
    period_weekdays = count_weekdays(start, end)
    skipped = []

    if employee_ids:
        employees = list(Employee.objects.filter(pk__in=employee_ids))
        found = {e.pk for e in employees}
        for missing in employee_ids:
            if missing not in found:
                skipped.append({"employee_number": None, "employee": str(missing), "reason": "Employee not found."})
    else:
        queryset = (
            Employee.objects.filter(date_joined__lte=end)
            .exclude(employment_status=EmploymentStatus.INACTIVE)
            .filter(Q(termination_date__isnull=True) | Q(termination_date__gte=start))
        )
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        employees = list(queryset)

    ids = [e.pk for e in employees]

    # latest structure covering the period, per employee (one query)
    structures = {}
    covering = (
        SalaryStructure.objects.filter(employee_id__in=ids, effective_from__lte=end)
        .filter(Q(effective_to__isnull=True) | Q(effective_to__gte=start))
        .order_by("employee_id", "-effective_from")
    )
    for structure in covering:
        structures.setdefault(structure.employee_id, structure)

    existing = {
        p.employee_id: p
        for p in Payroll.objects.filter(
            employee_id__in=ids, pay_period_start=start, pay_period_end=end
        )
    }

    leaves = defaultdict(list)
    if deduct_unpaid_leave:
        unpaid = LeaveRequest.objects.filter(
            employee_id__in=ids,
            status=LeaveRequest.LeaveStatus.APPROVED,
            leave_type__is_paid=False,
            start_date__lte=end,
            end_date__gte=start,
        ).values_list("employee_id", "start_date", "end_date", "days_requested")
        for employee_id, leave_start, leave_end, days_requested in unpaid:
            leaves[employee_id].append((leave_start, leave_end, days_requested))

    rows = []
    for employee in employees:
        label = {"employee_number": employee.employee_number, "employee": employee.full_name}

        reason = eligibility_reason(employee, start, end)
        if reason:
            skipped.append({**label, "reason": reason})
            continue

        structure = structures.get(employee.pk)
        if structure is None:
            skipped.append({**label, "reason": "No salary structure covers this period."})
            continue

        current = existing.get(employee.pk)
        if current is not None and current.status != PayrollStatus.CANCELLED:
            skipped.append({**label, "reason": f"Payroll already exists ({current.status})."})
            continue

        amounts = compute_amounts(
            employee, structure, start, end, total_days, period_weekdays, leaves.get(employee.pk, [])
        )
        rows.append(
            {
                "employee": employee,
                "structure": structure,
                "cancelled_record": current,  # reopened instead of inserted
                **amounts,
            }
        )

    return rows, skipped


@api_view(["POST"])
@permission_classes([IsAdminUser])
def generate_payroll(request):
    """
    {
      "pay_period_start": "2026-10-01",
      "pay_period_end": "2026-10-31",
      "employees": ["<uuid>", ...],     // OR "department": "<uuid>"; default = everyone eligible
      "deduct_unpaid_leave": true,
      "dry_run": true                    // preview only, nothing is saved
    }
    Creates PENDING payroll records. A previously CANCELLED record for the same
    employee and period is reopened with fresh figures.
    """

    serializer = GeneratePayrollSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    start, end = data["pay_period_start"], data["pay_period_end"]

    rows, skipped = build_payroll_rows(
        start,
        end,
        data.get("employees"),
        data.get("department"),
        data["deduct_unpaid_leave"],
    )

    total_gross = sum((r["gross_salary"] for r in rows), ZERO)
    total_net = sum((r["net_salary"] for r in rows), ZERO)

    summary = {
        "pay_period_start": start.isoformat(),
        "pay_period_end": end.isoformat(),
        "employees_included": len(rows),
        "total_gross": money_str(total_gross),
        "total_net": money_str(total_net),
        "skipped_count": len(skipped),
        "skipped": skipped[:SKIPPED_LIMIT],
    }

    if data["dry_run"]:
        return Response(
            {
                "dry_run": True,
                **summary,
                "preview": [
                    {
                        "employee_id": str(r["employee"].pk),
                        "employee_number": r["employee"].employee_number,
                        "employee_name": r["employee"].full_name,
                        "basic_salary": str(r["basic_salary"]),
                        "allowances": str(r["allowances"]),
                        "deductions": str(r["deductions"]),
                        "gross_salary": str(r["gross_salary"]),
                        "net_salary": str(r["net_salary"]),
                        "remarks": r["remarks"],
                    }
                    for r in rows[:PREVIEW_LIMIT]
                ],
            }
        )

    to_create, to_reopen = [], []
    now = timezone.now()

    for r in rows:
        structure = r["structure"]
        fields = {
            "salary_structure": structure,
            "basic_salary": r["basic_salary"],
            "allowances": r["allowances"],
            "deductions": r["deductions"],
            "gross_salary": r["gross_salary"],
            "net_salary": r["net_salary"],
            "currency": structure.currency,
            "status": PayrollStatus.PENDING,
            "payment_date": None,
            "reference_number": "",
            "remarks": r["remarks"],
        }

        record = r["cancelled_record"]
        if record is not None:
            for name, value in fields.items():
                setattr(record, name, value)
            record.updated_at = now  # bulk_update skips auto_now
            to_reopen.append(record)
        else:
            to_create.append(
                Payroll(
                    employee=r["employee"],
                    pay_period_start=start,
                    pay_period_end=end,
                    **fields,
                )
            )

    try:
        with transaction.atomic():
            Payroll.objects.bulk_create(to_create)
            Payroll.objects.bulk_update(
                to_reopen,
                [
                    "salary_structure", "basic_salary", "allowances", "deductions",
                    "gross_salary", "net_salary", "currency", "status",
                    "payment_date", "reference_number", "remarks", "updated_at",
                ],
            )
    except IntegrityError:
        return conflict("Payroll for this period was generated by someone else at the same time. Please retry.")

    log_action(
        request,
        AuditLog.Action.CREATE,
        "Payroll",
        description=(
            f"Payroll generated for {start} to {end}: {len(to_create)} created, "
            f"{len(to_reopen)} reopened, {len(skipped)} skipped "
            f"(net total {money_str(total_net)})"
        ),
    )

    return Response(
        {
            "dry_run": False,
            "message": "Payroll generated. Review the records, then process them.",
            "created": len(to_create),
            "reopened": len(to_reopen),
            **summary,
        },
        status=status.HTTP_201_CREATED,
    )


# =====================================================
# PAYROLL: LIST  (CSV with ?export=csv)
# =====================================================

PAYROLL_ORDERING = {
    "pay_period_start", "-pay_period_start", "net_salary", "-net_salary",
    "employee__first_name", "-employee__first_name", "status", "-status",
    "created_at", "-created_at",
}


def filtered_payroll(params):
    """
    Filters: employee, department, status, month (YYYY-MM), from, to
    (on pay_period_start), search, ordering.
    """
    queryset = Payroll.objects.select_related("employee", "employee__department")

    employee_id = parse_uuid_param(params, "employee")
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)

    department_id = parse_uuid_param(params, "department")
    if department_id:
        queryset = queryset.filter(employee__department_id=department_id)

    status_value = (params.get("status") or "").upper()
    if status_value:
        if status_value not in PayrollStatus.values:
            raise BadParam(f"'status' must be one of: {', '.join(PayrollStatus.values)}.")
        queryset = queryset.filter(status=status_value)

    if params.get("month"):
        month_start, next_month, _ = parse_month_param(params)
        queryset = queryset.filter(pay_period_start__gte=month_start, pay_period_start__lt=next_month)

    date_from = parse_date_param(params, "from")
    date_to = parse_date_param(params, "to")
    if date_from:
        queryset = queryset.filter(pay_period_start__gte=date_from)
    if date_to:
        queryset = queryset.filter(pay_period_start__lte=date_to)
    if date_from and date_to and date_to < date_from:
        raise BadParam("'to' cannot be earlier than 'from'.")

    for term in (params.get("search") or "").split()[:5]:
        queryset = queryset.filter(
            Q(employee__first_name__icontains=term)
            | Q(employee__last_name__icontains=term)
            | Q(employee__employee_number__icontains=term)
            | Q(reference_number__icontains=term)
        )

    ordering = params.get("ordering")
    if ordering:
        if ordering not in PAYROLL_ORDERING:
            raise BadParam(f"'ordering' must be one of: {', '.join(sorted(PAYROLL_ORDERING))}.")
        return queryset.order_by(ordering, "pk")
    return queryset.order_by("-pay_period_start", "employee__first_name", "pk")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def payroll_list(request):

    try:
        queryset = filtered_payroll(request.query_params)
    except BadParam as exc:
        return bad_request(str(exc))

    if request.query_params.get("export") == "csv":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="payroll.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Employee Number", "Employee", "Department", "Period Start", "Period End",
            "Basic", "Allowances", "Deductions", "Gross", "Net", "Currency",
            "Status", "Payment Date", "Reference",
        ])

        exported = 0
        for p in queryset.iterator():
            writer.writerow([
                csv_safe(p.employee.employee_number),
                csv_safe(p.employee.full_name),
                csv_safe(p.employee.department.name),
                p.pay_period_start.isoformat(),
                p.pay_period_end.isoformat(),
                p.basic_salary, p.allowances, p.deductions, p.gross_salary, p.net_salary,
                p.currency,
                p.status,
                p.payment_date.isoformat() if p.payment_date else "",
                csv_safe(p.reference_number),
            ])
            exported += 1

        log_action(
            request,
            AuditLog.Action.EXPORT,
            "Payroll",
            description=f"{exported} payroll record(s) exported to CSV",
        )
        return response

    paginator = StandardPagination()
    page = paginator.paginate_queryset(queryset, request)
    return paginator.get_paginated_response(PayrollSerializer(page, many=True).data)


# =====================================================
# PAYROLL: RETRIEVE + ADJUST + DELETE
# =====================================================

@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def payroll_detail(request, pk):
    """PATCH adjusts basic / allowances / deductions / remarks of a PENDING record."""

    payroll = get_object_or_404(
        Payroll.objects.select_related("employee", "employee__department"), pk=pk
    )

    if request.method == "GET":
        return Response(PayrollSerializer(payroll).data)

    if request.method == "DELETE":
        if payroll.status not in (PayrollStatus.PENDING, PayrollStatus.CANCELLED):
            return conflict(
                f"Cannot delete a {payroll.status.lower()} payroll record. Cancel it instead."
                if payroll.status == PayrollStatus.PROCESSED
                else "Paid payroll records are permanent and cannot be deleted."
            )

        label = f"{payroll.employee.employee_number} {payroll.pay_period_start}"
        payroll_id = payroll.pk
        payroll.delete()

        log_action(
            request,
            AuditLog.Action.DELETE,
            "Payroll",
            object_id=payroll_id,
            description=f"Payroll record deleted ({label})",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    with transaction.atomic():
        locked = get_object_or_404(Payroll.objects.select_for_update(), pk=pk)

        if locked.status != PayrollStatus.PENDING:
            return conflict("Only PENDING payroll records can be adjusted.")

        serializer = PayrollAdjustSerializer(data=request.data, context={"payroll": locked})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        locked.basic_salary = data.get("basic_salary", locked.basic_salary)
        locked.allowances = data.get("allowances", locked.allowances)
        locked.deductions = data.get("deductions", locked.deductions)
        if "remarks" in data:
            locked.remarks = data["remarks"]

        locked.gross_salary = locked.basic_salary + locked.allowances
        locked.net_salary = locked.gross_salary - locked.deductions
        locked.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Payroll",
        object_id=locked.pk,
        description=(
            f"Payroll for {payroll.employee.employee_number} {payroll.pay_period_start} "
            f"adjusted (fields: {changed_fields(serializer)})"
        ),
    )

    locked = Payroll.objects.select_related("employee", "employee__department").get(pk=pk)
    return Response(PayrollSerializer(locked).data)


# =====================================================
# PAYROLL: STATUS CHANGES
# =====================================================
#   PENDING --process--> PROCESSED --pay--> PAID
#   PENDING / PROCESSED --cancel--> CANCELLED      (PAID is final)

TRANSITIONS = {
    "process": ([PayrollStatus.PENDING], PayrollStatus.PROCESSED),
    "pay": ([PayrollStatus.PROCESSED], PayrollStatus.PAID),
    "cancel": ([PayrollStatus.PENDING, PayrollStatus.PROCESSED], PayrollStatus.CANCELLED),
}


def apply_transition(request, ids, action, payment_date=None, reference_number="", reason=""):
    """Moves every eligible record in `ids`. Returns (updated, skipped)."""

    from_statuses, to_status = TRANSITIONS[action]
    changes = {"status": to_status, "updated_at": timezone.now()}

    if action == "pay":
        changes["payment_date"] = payment_date
        changes["reference_number"] = reference_number
    if action == "cancel" and reason:
        changes["remarks"] = Concat(
            Value(f"[Cancelled: {reason[:200]}] "), F("remarks"), output_field=TextField()
        )

    with transaction.atomic():
        eligible = list(
            Payroll.objects.select_for_update()
            .filter(pk__in=ids, status__in=from_statuses)
            .values_list("pk", flat=True)
        )
        updated = Payroll.objects.filter(pk__in=eligible).update(**changes)

    skipped = len(ids) - updated

    if updated:
        log_action(
            request,
            AuditLog.Action.UPDATE,
            "Payroll",
            object_id=ids[0] if len(ids) == 1 else "",
            description=(
                f"Payroll {action}: {updated} record(s) moved to {to_status}"
                + (f", {skipped} skipped" if skipped else "")
                + (f" (ref {reference_number})" if action == "pay" else "")
            ),
        )

    return updated, skipped


def single_transition(request, pk, action, **kwargs):
    payroll = get_object_or_404(Payroll, pk=pk)

    updated, _ = apply_transition(request, [payroll.pk], action, **kwargs)
    if not updated:
        return conflict(f"A {payroll.status} payroll record cannot be moved with '{action}'.")

    refreshed = Payroll.objects.select_related("employee", "employee__department").get(pk=pk)
    return Response(
        {"message": f"Payroll {action} successful.", "payroll": PayrollSerializer(refreshed).data}
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def process_payroll(request, pk):
    return single_transition(request, pk, "process")


@api_view(["POST"])
@permission_classes([IsAdminUser])
def pay_payroll(request, pk):
    serializer = PaySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return single_transition(
        request,
        pk,
        "pay",
        payment_date=serializer.validated_data["payment_date"],
        reference_number=serializer.validated_data["reference_number"],
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def cancel_payroll(request, pk):
    serializer = CancelSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return single_transition(request, pk, "cancel", reason=serializer.validated_data.get("reason", ""))


@api_view(["POST"])
@permission_classes([IsAdminUser])
def bulk_payroll_action(request):
    """
    {"action": "process" | "pay" | "cancel", "ids": ["<uuid>", ...],
     "payment_date": "2026-11-05", "reference_number": "BATCH-001",   // pay only
     "reason": "..."}                                                  // cancel, optional
    Records not in a valid state for the action are skipped, not failed.
    """

    serializer = BulkActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    updated, skipped = apply_transition(
        request,
        data["ids"],
        data["action"],
        payment_date=data.get("payment_date"),
        reference_number=data.get("reference_number", ""),
        reason=data.get("reason", ""),
    )

    return Response(
        {
            "message": f"Bulk '{data['action']}' complete.",
            "updated": updated,
            "skipped": skipped,
        }
    )


# =====================================================
# PAYSLIP
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def payslip(request, pk):

    payroll = get_object_or_404(
        Payroll.objects.select_related("employee", "employee__department", "employee__position"),
        pk=pk,
    )

    if payroll.status == PayrollStatus.CANCELLED:
        return conflict("A cancelled payroll record has no payslip.")

    employee = payroll.employee

    return Response(
        {
            "payslip_number": f"PS-{payroll.pay_period_start:%Y%m}-{employee.employee_number}",
            "status": payroll.status,
            "employee": {
                "id": str(employee.pk),
                "employee_number": employee.employee_number,
                "name": employee.full_name,
                "department": employee.department.name,
                "position": employee.position.title,
            },
            "period": {
                "start": payroll.pay_period_start.isoformat(),
                "end": payroll.pay_period_end.isoformat(),
            },
            "currency": payroll.currency,
            "earnings": {
                "basic_salary": str(payroll.basic_salary),
                "allowances": str(payroll.allowances),
                "gross_salary": str(payroll.gross_salary),
            },
            "deductions": {"total": str(payroll.deductions)},
            "net_salary": str(payroll.net_salary),
            "payment_date": payroll.payment_date.isoformat() if payroll.payment_date else None,
            "reference_number": payroll.reference_number,
            "remarks": payroll.remarks,
        }
    )


# =====================================================
# SUMMARY REPORT
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def payroll_summary(request):
    """?month=YYYY-MM (default: current month)  ?department=<uuid>"""

    try:
        month_start, next_month, label = parse_month_param(request.query_params)
        department_id = parse_uuid_param(request.query_params, "department")
    except BadParam as exc:
        return bad_request(str(exc))

    scope = Payroll.objects.all()
    if department_id:
        scope = scope.filter(employee__department_id=department_id)

    month_qs = scope.filter(pay_period_start__gte=month_start, pay_period_start__lt=next_month)
    live = month_qs.exclude(status=PayrollStatus.CANCELLED)

    totals = live.aggregate(
        employees=Count("employee", distinct=True),
        basic=Sum("basic_salary"),
        allowances=Sum("allowances"),
        deductions=Sum("deductions"),
        gross=Sum("gross_salary"),
        net=Sum("net_salary"),
    )

    by_status = month_qs.values("status").annotate(
        records=Count("pk"), gross=Sum("gross_salary"), net=Sum("net_salary")
    ).order_by("status")

    by_department = (
        live.values("employee__department__name")
        .annotate(
            employees=Count("employee", distinct=True),
            gross=Sum("gross_salary"),
            net=Sum("net_salary"),
        )
        .order_by("-net", "employee__department__name")
    )

    # last 12 months, zero-filled
    months = last_n_months(timezone.localdate(), 12)
    trend_rows = {
        row["month"]: row
        for row in scope.exclude(status=PayrollStatus.CANCELLED)
        .filter(pay_period_start__gte=months[0])
        .annotate(month=TruncMonth("pay_period_start"))
        .values("month")
        .annotate(records=Count("pk"), gross=Sum("gross_salary"), net=Sum("net_salary"))
    }

    outstanding = scope.aggregate(
        awaiting_processing=Count("pk", filter=Q(status=PayrollStatus.PENDING)),
        awaiting_payment=Count("pk", filter=Q(status=PayrollStatus.PROCESSED)),
        amount_awaiting_payment=Sum("net_salary", filter=Q(status=PayrollStatus.PROCESSED)),
    )

    return Response(
        {
            "month": label,
            "totals": {
                "employees": totals["employees"],
                "basic_salary": money_str(totals["basic"]),
                "allowances": money_str(totals["allowances"]),
                "deductions": money_str(totals["deductions"]),
                "gross_salary": money_str(totals["gross"]),
                "net_salary": money_str(totals["net"]),
            },
            "by_status": [
                {
                    "status": row["status"],
                    "records": row["records"],
                    "gross_salary": money_str(row["gross"]),
                    "net_salary": money_str(row["net"]),
                }
                for row in by_status
            ],
            "by_department": [
                {
                    "department": row["employee__department__name"],
                    "employees": row["employees"],
                    "gross_salary": money_str(row["gross"]),
                    "net_salary": money_str(row["net"]),
                }
                for row in by_department
            ],
            "outstanding": {
                "awaiting_processing": outstanding["awaiting_processing"],
                "awaiting_payment": outstanding["awaiting_payment"],
                "amount_awaiting_payment": money_str(outstanding["amount_awaiting_payment"]),
            },
            "trend": [
                {
                    "month": m.strftime("%Y-%m"),
                    "records": trend_rows[m]["records"] if m in trend_rows else 0,
                    "gross_salary": money_str(trend_rows[m]["gross"]) if m in trend_rows else str(ZERO),
                    "net_salary": money_str(trend_rows[m]["net"]) if m in trend_rows else str(ZERO),
                }
                for m in months
            ],
        }
    )