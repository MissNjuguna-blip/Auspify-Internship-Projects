from core.models import AuditLog

def get_client_ip(request):
    if request is None:
        return None

    # REMOTE_ADDR is preferable unless your proxy configuration
    # explicitly establishes a trusted forwarded-IP header.
    return request.META.get("REMOTE_ADDR")


def log_action(
    *,
    actor=None,
    action=AuditLog.Action.OTHER,
    entity_type,
    entity_id="",
    description="",
    changes=None,
    request=None,
):
    """
    Create an audit log entry.

    Example:
        log_action(
            actor=request.user,
            action=AuditLog.Action.CREATE,
            entity_type="Book",
            entity_id=book.pk,
            description="Created a new book.",
            request=request,
        )
    """
    ip_address = get_client_ip(request)

    user_agent = ""
    if request is not None:
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:10000]

    if actor is not None and not getattr(actor, "is_authenticated", False):
        actor = None

    return AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=str(entity_type)[:100],
        entity_id=str(entity_id)[:100] if entity_id is not None else "",
        description=description,
        changes=changes or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )