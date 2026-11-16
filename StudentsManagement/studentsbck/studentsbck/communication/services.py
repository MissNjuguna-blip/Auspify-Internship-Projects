
from django.core.exceptions import ValidationError
from django.db import transaction

from core.models import Announcement


@transaction.atomic
def create_announcement(
    title,
    message,
    created_by,
):
    if not title.strip():
        raise ValidationError("Announcement title is required.")

    if not message.strip():
        raise ValidationError("Announcement message is required.")

    announcement = Announcement.objects.create(
        title=title,
        message=message,
        created_by=created_by,
        published=False,
    )

    return announcement

from django.core.exceptions import ValidationError


def update_announcement(
    announcement,
    title=None,
    message=None,
):
    if announcement.published:
        raise ValidationError(
            "Unpublish announcement before editing."
        )

    if title is not None:
        if not title.strip():
            raise ValidationError("Title cannot be empty.")

        announcement.title = title

    if message is not None:
        if not message.strip():
            raise ValidationError("Message cannot be empty.")

        announcement.message = message

    announcement.save()

    return announcement

from django.core.exceptions import ValidationError


def publish_announcement(announcement):

    if announcement.published:
        raise ValidationError(
            "Announcement is already published."
        )

    announcement.published = True
    announcement.save(update_fields=["published", "updated_at"])

    return announcement

def unpublish_announcement(announcement):

    if not announcement.published:
        return announcement

    announcement.published = False

    announcement.save(
        update_fields=["published", "updated_at"]
    )

    return announcement

def delete_announcement(announcement):

    announcement.delete()

    return True
