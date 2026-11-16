"""Query-parameter parsing shared by every report. Invalid input raises BadParam (-> 400)."""

from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.utils import timezone
from django.utils.dateparse import parse_date

from core.utils import BadParam

MAX_RANGE_DAYS = 366
MAX_MONTH_SPAN = 24


def parse_date_param(params, name):
    raw = params.get(name)
    if not raw:
        return None
    value = parse_date(raw)
    if value is None:
        raise BadParam(f"'{name}' must be a valid date in YYYY-MM-DD format.")
    return value


def parse_period(params, default="month"):
    """
    ?from=YYYY-MM-DD&to=YYYY-MM-DD
    `to` defaults to today. `from` defaults to the first day of that month
    (default="month") or 364 days earlier (default="year").
    """
    start = parse_date_param(params, "from")
    end = parse_date_param(params, "to") or timezone.localdate()

    if start is None:
        start = end.replace(day=1) if default == "month" else end - timedelta(days=364)

    if end < start:
        raise BadParam("'to' cannot be earlier than 'from'.")
    if (end - start).days + 1 > MAX_RANGE_DAYS:
        raise BadParam(f"The date range cannot be longer than {MAX_RANGE_DAYS} days.")
    return start, end


def parse_month(params, name):
    raw = params.get(name)
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y-%m").date()
    except ValueError:
        raise BadParam(f"'{name}' must be in YYYY-MM format.")


def parse_month_range(params):
    """
    ?from_month=YYYY-MM&to_month=YYYY-MM  (default: the last 12 months)
    Returns (first day of from_month, first day AFTER to_month).
    """
    to_month = parse_month(params, "to_month") or timezone.localdate().replace(day=1)
    from_month = parse_month(params, "from_month")

    if from_month is None:
        year, month = to_month.year, to_month.month - 11
        if month <= 0:
            month, year = month + 12, year - 1
        from_month = to_month.replace(year=year, month=month)

    if to_month < from_month:
        raise BadParam("'to_month' cannot be earlier than 'from_month'.")

    span = (to_month.year - from_month.year) * 12 + to_month.month - from_month.month + 1
    if span > MAX_MONTH_SPAN:
        raise BadParam(f"The range cannot be longer than {MAX_MONTH_SPAN} months.")

    return from_month, (to_month + timedelta(days=32)).replace(day=1)


def parse_year(params, name="year"):
    today = timezone.localdate()
    raw = params.get(name)
    if not raw:
        return today.year
    try:
        year = int(raw)
    except ValueError:
        raise BadParam(f"'{name}' must be a 4-digit year.")
    if not 2000 <= year <= today.year + 1:
        raise BadParam(f"'{name}' must be between 2000 and {today.year + 1}.")
    return year


def parse_int_param(params, name, default=None, minimum=1, maximum=10**9):
    raw = params.get(name)
    if raw in (None, ""):
        return default
    try:
        value = int(raw)
    except ValueError:
        raise BadParam(f"'{name}' must be a whole number.")
    if not minimum <= value <= maximum:
        raise BadParam(f"'{name}' must be between {minimum} and {maximum}.")
    return value


def parse_decimal_param(params, name, default, minimum=Decimal("0"), maximum=Decimal("365")):
    raw = params.get(name)
    if raw in (None, ""):
        return default
    try:
        value = Decimal(raw)
    except InvalidOperation:
        raise BadParam(f"'{name}' must be a number.")
    if not minimum <= value <= maximum:
        raise BadParam(f"'{name}' must be between {minimum} and {maximum}.")
    return value


def parse_choice_param(params, name, allowed, default=None, upper=False):
    raw = params.get(name)
    if not raw:
        return default
    value = raw.strip().upper() if upper else raw.strip().lower()
    if value not in allowed:
        raise BadParam(f"'{name}' must be one of: {', '.join(allowed)}.")
    return value