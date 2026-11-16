
from core.models import AuditLog


def get_client_ip(request):
    """
    Retrieve the direct client IP address.

    Only trust forwarded IP headers when they are
    configured by a trusted reverse proxy.
    """
    if not request:
        return None

    return request.META.get('REMOTE_ADDR') or None


def log_action(
    request,
    action,
    model_name,
    object_id='',
    description='',
    user=None
):
    """
    Record activities performed by users.

    Supports:
    - Registration
    - Login and logout
    - Project creation and updates
    - Task creation and updates
    - Task assignments
    - Comments
    - Notifications
    - Administrative activities
    """

    if user is None and request and request.user.is_authenticated:
        user = request.user

    return AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        description=description,
        ip_address=get_client_ip(request)
    )


def user_payload(user):
    """
    Return a safe user representation.
    Never expose passwords or authentication tokens.
    """

    return {
        'id': str(user.pk),
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'phone_number': user.phone_number,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
    }
