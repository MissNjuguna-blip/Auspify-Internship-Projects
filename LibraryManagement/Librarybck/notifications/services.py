from django.utils import timezone
from core.models import Member, Notification

def create_member_notification(
    member,
    subject,
    message,
    notification_type=Notification.NotificationType.GENERAL,
    channel=Notification.Channel.IN_APP,
):
    """
    Create a notification for a library member.

    If the member has a linked user account, the notification
    is associated with that account for in-app retrieval.
    """

    if not isinstance(member, Member):
        raise ValueError("A valid library member is required.")

    recipient = member.user

    notification = Notification.objects.create(
        recipient=recipient,
        recipient_email=member.email,
        recipient_phone=member.phone_number,
        notification_type=notification_type,
        channel=channel,
        subject=subject,
        message=message,
        status=Notification.Status.PENDING,
    )

    # In-app notifications are immediately available in the
    # application; email/SMS delivery requires a delivery worker.
    if channel == Notification.Channel.IN_APP:
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save(update_fields=["status", "sent_at"])

    return notification
