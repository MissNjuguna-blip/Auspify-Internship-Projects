"""
Shared helpers used by every app (audit logging, pagination, query-param parsing,
CSV safety). Import from here instead of copying these into each views.py.
"""

import uuid

from rest_framework.pagination import PageNumberPagination

from core.models import AuditLog


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class BadParam(Exception):
    """Raised for an invalid query parameter; views turn it into a 400."""


def parse_uuid_param(params, name):
    raw = params.get(name)
    if not raw:
        return None
    try:
        return uuid.UUID(raw)
    except ValueError:
        raise BadParam(f"'{name}' must be a valid UUID.")


def parse_bool_param(params, name):
    raw = params.get(name)
    if raw is None or raw == "":
        return None
    value = raw.strip().lower()
    if value in ("true", "1", "yes"):
        return True
    if value in ("false", "0", "no"):
        return False
    raise BadParam(f"'{name}' must be true or false.")


def csv_safe(value):
    """Prevent spreadsheet formula injection in exported cells."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


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