"""
Report calculations. Every function returns (data, table_builder):

  data           JSON-safe dict returned by the API
  table_builder  None, or a zero-argument callable returning (headers, rows)
                 used for ?export=csv (only run when a CSV is requested)

Reports are read-only: nothing here writes to the database.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.db.models import (
    Avg,
    Count,
    DecimalField,
    DurationField,
    ExpressionWrapper,
    F,
    Q,
    Sum,
)
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone

from core.models import (
    Attendance,
    AuditLog,
    Employee,
    LeaveBalance,
    LeaveRequest,
    Payroll,
)

EmploymentStatus = Employee.EmploymentStatus
AttendanceStatus = Attendance.AttendanceStatus
LeaveStatus = LeaveRequest.LeaveStatus
PayrollStatus = Payroll.PayrollStatus

ZERO = Decimal("0.00")
AUDIT_EXPORT_LIMIT = 50_000

AGE_BANDS = [(0, 24), (25, 34), (35, 44), (45, 54), (55, 64), (65, None)]
TENURE_BANDS = [(0, 1), (1, 2), (2, 5), (5, 10), (10, None)]


# =====================================================
# HELPERS
# =====================================================

def years_ago(day, years):
    """The same calendar day `years` earlier (29 Feb -> 28 Feb)."""
    try:
        return day.replace(year=day.year - years)
    except ValueError:
        return day.replace(year=day.year - years, day=28)


def months_between(start, end):
    """First day of every month from start's month to end's month, inclusive."""
    months, current = [], start.replace(day=1)
    last = end.replace(day=1)
    while current <= last:
        months.append(current)
        current = (current + timedelta(days=32)).replace(day=1)
    return months


def next_occurrence(original, today):
    """Next date on/after today with the same month and day as `original`."""
    for year in (today.year, today.year + 1):
        try:
            candidate = original.replace(year=year)
        except ValueError:                      # 29 Feb in a non-leap year
            candidate = date(year, 2, 28)
        if candidate >= today:
            return candidate


def full_name(first, middle, last):
    return " ".join(p for p in (first, middle, last) if p)


def money_str(value):
    return str(Decimal(value or ZERO).quantize(Decimal("0.01")))


def percent(part, whole):
    return round(float(part) / float(whole) * 100, 2) if whole else 0.0


def attendance_rate(present, late, half_day, absent):
    """Share of working (non-leave) days attended."""
    attended = present + late + half_day
    return percent(attended, attended + absent)


def day_range(start, end):
    """Timezone-aware [start 00:00, day after end 00:00) for datetime filters."""
    tz = timezone.get_current_timezone()
    return (
        timezone.make_aware(datetime.combine(start, time.min), tz),
        timezone.make_aware(datetime.combine(end + timedelta(days=1), time.min), tz),
    )


def status_counts():
    """Fresh set of per-status Count expressions for attendance."""
    return {
        "present": Count("pk", filter=Q(status=AttendanceStatus.PRESENT)),
        "late": Count("pk", filter=Q(status=AttendanceStatus.LATE)),
        "half_day": Count("pk", filter=Q(status=AttendanceStatus.HALF_DAY)),
        "absent": Count("pk", filter=Q(status=AttendanceStatus.ABSENT)),
        "on_leave": Count("pk", filter=Q(status=AttendanceStatus.ON_LEAVE)),
    }


def band_label(lo, hi, unit=""):
    if hi is None:
        return f"{lo}+{unit}"
    return f"{lo}-{hi}{unit}"


# =====================================================
# EMPLOYEES: HEADCOUNT
# =====================================================

def headcount_report(department_id=None):
    today = timezone.localdate()

    qs = Employee.objects.exclude(employment_status=EmploymentStatus.TERMINATED)
    if department_id:
        qs = qs.filter(department_id=department_id)

    def by_status():
        return {
            "active": Count("pk", filter=Q(employment_status=EmploymentStatus.ACTIVE)),
            "on_leave": Count("pk", filter=Q(employment_status=EmploymentStatus.ON_LEAVE)),
            "inactive": Count("pk", filter=Q(employment_status=EmploymentStatus.INACTIVE)),
        }

    totals = qs.aggregate(total=Count("pk"), **by_status())

    by_department = list(
        qs.values("department_id", "department__name")
        .annotate(total=Count("pk"), **by_status())
        .order_by("-total", "department__name")
    )
    by_position = list(
        qs.values("position__title", "position__department__name")
        .annotate(total=Count("pk"))
        .order_by("-total", "position__title")[:15]
    )
    by_gender = list(qs.values("gender").annotate(total=Count("pk")).order_by("gender"))

    # age and tenure bands: one query each (date arithmetic done in Python)
    age_filters = {}
    for i, (low, high) in enumerate(AGE_BANDS):
        condition = Q(date_of_birth__lte=years_ago(today, low))
        if high is not None:
            condition &= Q(date_of_birth__gt=years_ago(today, high + 1))
        age_filters[f"b{i}"] = Count("pk", filter=condition)
    ages = qs.aggregate(**age_filters)

    tenure_filters = {}
    for i, (low, high) in enumerate(TENURE_BANDS):
        condition = Q(date_joined__lte=years_ago(today, low))
        if high is not None:
            condition &= Q(date_joined__gt=years_ago(today, high))
        tenure_filters[f"b{i}"] = Count("pk", filter=condition)
    tenures = qs.aggregate(**tenure_filters)

    joined = [d for d in qs.values_list("date_joined", flat=True) if d <= today]
    average_tenure = round(sum((today - d).days for d in joined) / len(joined) / 365.25, 1) if joined else 0

    data = {
        "as_of": today.isoformat(),
        "totals": totals,
        "by_department": [
            {
                "department_id": str(r["department_id"]),
                "department": r["department__name"],
                "total": r["total"],
                "active": r["active"],
                "on_leave": r["on_leave"],
                "inactive": r["inactive"],
                "share_percent": percent(r["total"], totals["total"]),
            }
            for r in by_department
        ],
        "top_positions": [
            {
                "position": r["position__title"],
                "department": r["position__department__name"],
                "total": r["total"],
            }
            for r in by_position
        ],
        "by_gender": by_gender,
        "age_bands": [
            {"band": "Under 25" if hi == 24 else band_label(lo, hi), "total": ages[f"b{i}"]}
            for i, (lo, hi) in enumerate(AGE_BANDS)
        ],
        "tenure_bands": [
            {
                "band": ("Under 1 year" if hi == 1 else band_label(lo, hi, " years")),
                "total": tenures[f"b{i}"],
            }
            for i, (lo, hi) in enumerate(TENURE_BANDS)
        ],
        "average_tenure_years": average_tenure,
    }

    def table():
        return (
            ["Department", "Total", "Active", "On Leave", "Inactive", "Share (%)"],
            [
                [d["department"], d["total"], d["active"], d["on_leave"], d["inactive"], d["share_percent"]]
                for d in data["by_department"]
            ],
        )

    return data, table


# =====================================================
# EMPLOYEES: TURNOVER
# =====================================================

def _headcount_on(day, department_id):
    """Employees employed at the END of `day`."""
    qs = Employee.objects.filter(date_joined__lte=day).filter(
        Q(termination_date__isnull=True) | Q(termination_date__gt=day)
    )
    if department_id:
        qs = qs.filter(department_id=department_id)
    return qs.count()


def turnover_report(start, end, department_id=None):
    hires_qs = Employee.objects.filter(date_joined__range=(start, end))
    exits_qs = Employee.objects.filter(
        employment_status=EmploymentStatus.TERMINATED,
        termination_date__range=(start, end),
    )
    if department_id:
        hires_qs = hires_qs.filter(department_id=department_id)
        exits_qs = exits_qs.filter(department_id=department_id)

    opening = _headcount_on(start - timedelta(days=1), department_id)
    closing = _headcount_on(end, department_id)
    hires, exits = hires_qs.count(), exits_qs.count()

    average = (opening + closing) / 2
    period_rate = percent(exits, average)
    days = (end - start).days + 1

    hires_by_month = {
        r["month"]: r["total"]
        for r in hires_qs.annotate(month=TruncMonth("date_joined")).values("month").annotate(total=Count("pk"))
    }
    exits_by_month = {
        r["month"]: r["total"]
        for r in exits_qs.annotate(month=TruncMonth("termination_date")).values("month").annotate(total=Count("pk"))
    }
    monthly = [
        {
            "month": m.strftime("%Y-%m"),
            "hires": hires_by_month.get(m, 0),
            "terminations": exits_by_month.get(m, 0),
            "net_change": hires_by_month.get(m, 0) - exits_by_month.get(m, 0),
        }
        for m in months_between(start, end)
    ]

    exits_by_department = list(
        exits_qs.values("department__name").annotate(total=Count("pk")).order_by("-total", "department__name")
    )

    data = {
        "period": {"from": start.isoformat(), "to": end.isoformat(), "days": days},
        "opening_headcount": opening,
        "closing_headcount": closing,
        "average_headcount": round(average, 1),
        "hires": hires,
        "terminations": exits,
        "turnover_rate_percent": period_rate,
        "annualised_turnover_rate_percent": round(period_rate * 365 / days, 2),
        "monthly": monthly,
        "terminations_by_department": [
            {"department": r["department__name"], "total": r["total"]} for r in exits_by_department
        ],
        "notes": "Headcount is counted at the end of each day. Rate = terminations / average headcount.",
    }

    def table():
        return (
            ["Month", "Hires", "Terminations", "Net Change"],
            [[m["month"], m["hires"], m["terminations"], m["net_change"]] for m in monthly],
        )

    return data, table


# =====================================================
# EMPLOYEES: UPCOMING BIRTHDAYS AND WORK ANNIVERSARIES
# =====================================================

def upcoming_events_report(days=30, department_id=None):
    today = timezone.localdate()

    qs = Employee.objects.exclude(employment_status=EmploymentStatus.TERMINATED)
    if department_id:
        qs = qs.filter(department_id=department_id)

    events = []
    rows = qs.values_list(
        "employee_number", "first_name", "middle_name", "last_name",
        "department__name", "date_of_birth", "date_joined",
    )
    for number, first, middle, last, department, birth, joined in rows:
        name = full_name(first, middle, last)
        base = {"employee_number": number, "employee": name, "department": department}

        occurrence = next_occurrence(birth, today)
        until = (occurrence - today).days
        if until <= days:
            events.append({
                **base, "type": "BIRTHDAY", "date": occurrence, "days_until": until,
                "detail": f"Turning {occurrence.year - birth.year}",
            })

        occurrence = next_occurrence(joined, today)
        years = occurrence.year - joined.year
        until = (occurrence - today).days
        if years >= 1 and until <= days:
            events.append({
                **base, "type": "ANNIVERSARY", "date": occurrence, "days_until": until,
                "detail": f"{years} year(s) of service",
            })

    events.sort(key=lambda e: (e["date"], e["type"], e["employee"]))

    data = {
        "from": today.isoformat(),
        "to": (today + timedelta(days=days)).isoformat(),
        "birthdays": sum(1 for e in events if e["type"] == "BIRTHDAY"),
        "anniversaries": sum(1 for e in events if e["type"] == "ANNIVERSARY"),
        "events": [{**e, "date": e["date"].isoformat()} for e in events],
    }

    def table():
        return (
            ["Type", "Employee Number", "Employee", "Department", "Date", "Days Until", "Detail"],
            [
                [e["type"], e["employee_number"], e["employee"], e["department"],
                 e["date"].isoformat(), e["days_until"], e["detail"]]
                for e in events
            ],
        )

    return data, table


# =====================================================
# ATTENDANCE
# =====================================================

def attendance_report(start, end, department_id=None):
    qs = Attendance.objects.filter(attendance_date__range=(start, end))
    if department_id:
        qs = qs.filter(employee__department_id=department_id)

    totals = qs.aggregate(records=Count("pk"), **status_counts())

    average_worked = qs.filter(check_in__isnull=False, check_out__isnull=False).aggregate(
        average=Avg(ExpressionWrapper(F("check_out") - F("check_in"), output_field=DurationField()))
    )["average"]

    def with_rate(row):
        return {**row, "attendance_rate": attendance_rate(row["present"], row["late"], row["half_day"], row["absent"])}

    by_department = [
        with_rate(r)
        for r in qs.values("employee__department__name")
        .annotate(records=Count("pk"), **status_counts())
        .order_by("employee__department__name")
    ]

    daily = [
        with_rate(r)
        for r in qs.values("attendance_date")
        .annotate(records=Count("pk"), **status_counts())
        .order_by("attendance_date")
    ]

    employee_rows = [
        with_rate({**r, "employee_name": full_name(r["employee__first_name"], r["employee__middle_name"], r["employee__last_name"])})
        for r in qs.values(
            "employee_id", "employee__employee_number", "employee__first_name",
            "employee__middle_name", "employee__last_name", "employee__department__name",
        )
        .annotate(records=Count("pk"), **status_counts())
        .order_by("employee__first_name", "employee__last_name", "employee_id")
    ]

    def top(field):
        ranked = sorted(
            (r for r in employee_rows if r[field] > 0),
            key=lambda r: (-r[field], r["employee_name"]),
        )[:10]
        return [
            {
                "employee_number": r["employee__employee_number"],
                "employee": r["employee_name"],
                "department": r["employee__department__name"],
                field: r[field],
            }
            for r in ranked
        ]

    data = {
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "totals": {
            **totals,
            "attendance_rate": attendance_rate(totals["present"], totals["late"], totals["half_day"], totals["absent"]),
            "employees_covered": len(employee_rows),
            "average_hours_worked": round(average_worked.total_seconds() / 3600, 2) if average_worked else 0,
        },
        "by_department": [
            {
                "department": r["employee__department__name"],
                **{k: r[k] for k in ("records", "present", "late", "half_day", "absent", "on_leave", "attendance_rate")},
            }
            for r in by_department
        ],
        "daily_trend": [
            {
                "date": r["attendance_date"].isoformat(),
                **{k: r[k] for k in ("records", "present", "late", "half_day", "absent", "on_leave", "attendance_rate")},
            }
            for r in daily
        ],
        "most_absent": top("absent"),
        "most_late": top("late"),
    }

    def table():
        return (
            ["Employee Number", "Employee", "Department", "Records", "Present", "Late",
             "Half Day", "Absent", "On Leave", "Attendance Rate (%)"],
            [
                [r["employee__employee_number"], r["employee_name"], r["employee__department__name"],
                 r["records"], r["present"], r["late"], r["half_day"], r["absent"], r["on_leave"],
                 r["attendance_rate"]]
                for r in employee_rows
            ],
        )

    return data, table


# =====================================================
# LEAVE: USAGE (leave that STARTS within the period)
# =====================================================

def leave_report(start, end, department_id=None):
    today = timezone.localdate()

    qs = LeaveRequest.objects.filter(start_date__range=(start, end))
    if department_id:
        qs = qs.filter(employee__department_id=department_id)
    approved = qs.filter(status=LeaveStatus.APPROVED)

    by_status = list(
        qs.values("status").annotate(requests=Count("pk"), days=Sum("days_requested")).order_by("status")
    )
    by_type = list(
        approved.values("leave_type__name", "leave_type__is_paid")
        .annotate(requests=Count("pk"), days=Sum("days_requested"))
        .order_by("-days", "leave_type__name")
    )
    by_department = list(
        approved.values("employee__department__name")
        .annotate(requests=Count("pk"), employees=Count("employee", distinct=True), days=Sum("days_requested"))
        .order_by("-days", "employee__department__name")
    )
    by_month = {
        r["month"]: r
        for r in approved.annotate(month=TruncMonth("start_date"))
        .values("month")
        .annotate(requests=Count("pk"), days=Sum("days_requested"))
    }
    top_takers = list(
        approved.values(
            "employee__employee_number", "employee__first_name",
            "employee__middle_name", "employee__last_name",
        )
        .annotate(requests=Count("pk"), days=Sum("days_requested"))
        .order_by("-days", "employee__first_name")[:10]
    )

    away_qs = LeaveRequest.objects.filter(
        status=LeaveStatus.APPROVED, start_date__lte=today, end_date__gte=today
    )
    if department_id:
        away_qs = away_qs.filter(employee__department_id=department_id)
    away_now = list(
        away_qs.select_related("employee", "employee__department", "leave_type").order_by("end_date")[:50]
    )

    data = {
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "note": "Counts leave requests that START within the period. Days are the requested working days.",
        "by_status": [
            {"status": r["status"], "requests": r["requests"], "days": str(r["days"] or ZERO)} for r in by_status
        ],
        "approved_days": money_str(sum((r["days"] or ZERO for r in by_type), ZERO)),
        "by_type": [
            {
                "leave_type": r["leave_type__name"],
                "paid": r["leave_type__is_paid"],
                "requests": r["requests"],
                "days": str(r["days"] or ZERO),
            }
            for r in by_type
        ],
        "by_department": [
            {
                "department": r["employee__department__name"],
                "employees": r["employees"],
                "requests": r["requests"],
                "days": str(r["days"] or ZERO),
            }
            for r in by_department
        ],
        "by_month": [
            {
                "month": m.strftime("%Y-%m"),
                "requests": by_month[m]["requests"] if m in by_month else 0,
                "days": str(by_month[m]["days"] or ZERO) if m in by_month else str(ZERO),
            }
            for m in months_between(start, end)
        ],
        "top_leave_takers": [
            {
                "employee_number": r["employee__employee_number"],
                "employee": full_name(r["employee__first_name"], r["employee__middle_name"], r["employee__last_name"]),
                "requests": r["requests"],
                "days": str(r["days"] or ZERO),
            }
            for r in top_takers
        ],
        "on_leave_today": [
            {
                "employee_number": l.employee.employee_number,
                "employee": l.employee.full_name,
                "department": l.employee.department.name,
                "leave_type": l.leave_type.name,
                "returns_after": l.end_date.isoformat(),
            }
            for l in away_now
        ],
    }

    def table():
        rows = (
            [
                l.employee.employee_number, l.employee.full_name, l.employee.department.name,
                l.leave_type.name, "Paid" if l.leave_type.is_paid else "Unpaid",
                l.start_date.isoformat(), l.end_date.isoformat(), l.days_requested, l.status,
            ]
            for l in qs.select_related("employee", "employee__department", "leave_type")
            .order_by("start_date", "employee__first_name", "pk")
            .iterator()
        )
        return (
            ["Employee Number", "Employee", "Department", "Leave Type", "Paid",
             "Start", "End", "Days", "Status"],
            rows,
        )

    return data, table


# =====================================================
# LEAVE: BALANCES
# =====================================================

def leave_balances_report(year, department_id=None, leave_type_id=None, low_threshold=Decimal("3")):
    remaining = ExpressionWrapper(
        F("allocated_days") - F("used_days"),
        output_field=DecimalField(max_digits=7, decimal_places=2),
    )

    qs = (
        LeaveBalance.objects.filter(year=year)
        .exclude(employee__employment_status=EmploymentStatus.TERMINATED)
        .select_related("employee", "employee__department", "leave_type")
        .annotate(remaining=remaining)
    )
    if department_id:
        qs = qs.filter(employee__department_id=department_id)
    if leave_type_id:
        qs = qs.filter(leave_type_id=leave_type_id)

    overall = qs.aggregate(
        employees=Count("employee", distinct=True),
        allocated=Sum("allocated_days"),
        used=Sum("used_days"),
    )

    by_type = list(
        qs.values("leave_type__name")
        .annotate(employees=Count("employee", distinct=True), allocated=Sum("allocated_days"), used=Sum("used_days"))
        .order_by("leave_type__name")
    )

    low_qs = qs.filter(remaining__lte=low_threshold)
    low_count = low_qs.count()
    low = list(low_qs.order_by("remaining", "employee__first_name")[:100])

    def utilisation(allocated, used):
        return percent(used or 0, allocated or 0)

    data = {
        "year": year,
        "low_balance_threshold_days": str(low_threshold),
        "totals": {
            "employees": overall["employees"],
            "allocated_days": str(overall["allocated"] or ZERO),
            "used_days": str(overall["used"] or ZERO),
            "remaining_days": str((overall["allocated"] or ZERO) - (overall["used"] or ZERO)),
            "utilisation_percent": utilisation(overall["allocated"], overall["used"]),
        },
        "by_leave_type": [
            {
                "leave_type": r["leave_type__name"],
                "employees": r["employees"],
                "allocated_days": str(r["allocated"] or ZERO),
                "used_days": str(r["used"] or ZERO),
                "remaining_days": str((r["allocated"] or ZERO) - (r["used"] or ZERO)),
                "utilisation_percent": utilisation(r["allocated"], r["used"]),
            }
            for r in by_type
        ],
        "low_balance_count": low_count,
        "low_balances": [
            {
                "employee_number": b.employee.employee_number,
                "employee": b.employee.full_name,
                "department": b.employee.department.name,
                "leave_type": b.leave_type.name,
                "remaining_days": str(b.remaining),
            }
            for b in low
        ],
    }

    def table():
        rows = (
            [
                b.employee.employee_number, b.employee.full_name, b.employee.department.name,
                b.leave_type.name, b.year, b.allocated_days, b.used_days, b.remaining,
            ]
            for b in qs.order_by("employee__first_name", "employee__last_name", "leave_type__name", "pk").iterator()
        )
        return (
            ["Employee Number", "Employee", "Department", "Leave Type", "Year",
             "Allocated", "Used", "Remaining"],
            rows,
        )

    return data, table


# =====================================================
# PAYROLL: COST  (cancelled records excluded; never mixes currencies)
# =====================================================

def payroll_cost_report(from_month, end_exclusive, department_id=None, breakdown="month"):
    qs = Payroll.objects.exclude(status=PayrollStatus.CANCELLED).filter(
        pay_period_start__gte=from_month, pay_period_start__lt=end_exclusive
    )
    if department_id:
        qs = qs.filter(employee__department_id=department_id)

    def sums():
        return {
            "records": Count("pk"),
            "employees": Count("employee", distinct=True),
            "basic": Sum("basic_salary"),
            "allowances": Sum("allowances"),
            "deductions": Sum("deductions"),
            "gross": Sum("gross_salary"),
            "net": Sum("net_salary"),
        }

    def fmt(row):
        return {
            "records": row["records"],
            "employees": row["employees"],
            "basic_salary": money_str(row["basic"]),
            "allowances": money_str(row["allowances"]),
            "deductions": money_str(row["deductions"]),
            "gross_salary": money_str(row["gross"]),
            "net_salary": money_str(row["net"]),
        }

    totals = list(qs.values("currency").annotate(**sums()).order_by("currency"))
    monthly = list(
        qs.annotate(month=TruncMonth("pay_period_start"))
        .values("month", "currency")
        .annotate(**sums())
        .order_by("month", "currency")
    )
    departments = list(
        qs.values("employee__department__name", "currency")
        .annotate(**sums())
        .order_by("currency", "-net", "employee__department__name")
    )
    statuses = list(
        qs.values("status", "currency")
        .annotate(records=Count("pk"), net=Sum("net_salary"))
        .order_by("status", "currency")
    )

    last_month = (end_exclusive - timedelta(days=1)).replace(day=1)

    data = {
        "from_month": from_month.strftime("%Y-%m"),
        "to_month": last_month.strftime("%Y-%m"),
        "totals_by_currency": [{"currency": r["currency"], **fmt(r)} for r in totals],
        "by_month": [
            {"month": r["month"].strftime("%Y-%m"), "currency": r["currency"], **fmt(r)} for r in monthly
        ],
        "by_department": [
            {"department": r["employee__department__name"], "currency": r["currency"], **fmt(r)}
            for r in departments
        ],
        "by_status": [
            {"status": r["status"], "currency": r["currency"], "records": r["records"], "net_salary": money_str(r["net"])}
            for r in statuses
        ],
    }

    def table():
        if breakdown == "department":
            return (
                ["Department", "Currency", "Employees", "Records", "Basic", "Allowances", "Deductions", "Gross", "Net"],
                [
                    [d["department"], d["currency"], d["employees"], d["records"], d["basic_salary"],
                     d["allowances"], d["deductions"], d["gross_salary"], d["net_salary"]]
                    for d in data["by_department"]
                ],
            )
        return (
            ["Month", "Currency", "Employees", "Records", "Basic", "Allowances", "Deductions", "Gross", "Net"],
            [
                [m["month"], m["currency"], m["employees"], m["records"], m["basic_salary"],
                 m["allowances"], m["deductions"], m["gross_salary"], m["net_salary"]]
                for m in data["by_month"]
            ],
        )

    return data, table


# =====================================================
# AUDIT ACTIVITY
# =====================================================

def audit_report(start, end, user_id=None, action=None, model_name=None):
    """Returns (summary, table_builder, entries_queryset) - the view paginates the entries."""
    start_dt, end_dt = day_range(start, end)

    qs = AuditLog.objects.filter(created_at__gte=start_dt, created_at__lt=end_dt)
    if user_id:
        qs = qs.filter(user_id=user_id)
    if action:
        qs = qs.filter(action=action)
    if model_name:
        qs = qs.filter(model_name__iexact=model_name)

    summary = {
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "total_events": qs.count(),
        "failed_logins": qs.filter(action=AuditLog.Action.LOGIN, user__isnull=True).count(),
        "by_action": list(qs.values("action").annotate(total=Count("pk")).order_by("-total")),
        "by_user": [
            {"user": r["user__username"] or "(anonymous / system)", "total": r["total"]}
            for r in qs.values("user__username").annotate(total=Count("pk")).order_by("-total")[:10]
        ],
        "by_model": list(qs.values("model_name").annotate(total=Count("pk")).order_by("-total")[:10]),
        "by_day": [
            {"date": r["day"].isoformat(), "total": r["total"]}
            for r in qs.annotate(day=TruncDate("created_at")).values("day").annotate(total=Count("pk")).order_by("day")
        ],
    }

    entries = qs.select_related("user").order_by("-created_at", "pk")

    def table():
        rows = (
            [
                e.created_at.isoformat(), e.user.username if e.user_id else "",
                e.action, e.model_name, e.object_id, e.description, e.ip_address or "",
            ]
            for e in entries[:AUDIT_EXPORT_LIMIT].iterator()
        )
        return (["Time", "User", "Action", "Model", "Object ID", "Description", "IP Address"], rows)

    return summary, table, entries