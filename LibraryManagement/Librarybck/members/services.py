from datetime import date
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.models import Member


@transaction.atomic
def register_member(**validated_data):
    """Register a reader without requiring a login account."""

    membership_number = validated_data.get(
        "membership_number", ""
    ).strip()

    if Member.objects.filter(
        membership_number__iexact=membership_number
    ).exists():
        raise ValidationError({
            "membership_number": "Membership number already exists."
        })

    validated_data["membership_number"] = membership_number

    # Readers do not need an accounts.User record.
    validated_data["user"] = None

    return Member.objects.create(**validated_data)


@transaction.atomic
def renew_membership(member, expiry_date=None):
    """Renew an existing membership."""

    member = Member.objects.select_for_update().get(pk=member.pk)
    today = timezone.localdate()

    if member.status == Member.Status.CLOSED:
        raise ValidationError(
            "A closed membership cannot be renewed."
        )

    if expiry_date is None:
        base_date = member.expiry_date

        if base_date is None or base_date < today:
            base_date = today

        try:
            expiry_date = base_date.replace(
                year=base_date.year + 1
            )
        except ValueError:
            # Handles February 29 in a non-leap year.
            expiry_date = base_date.replace(
                year=base_date.year + 1,
                month=2,
                day=28,
            )

    if expiry_date < today:
        raise ValidationError({
            "expiry_date": "Expiry date must be today or later."
        })

    if expiry_date < member.joined_date:
        raise ValidationError({
            "expiry_date": (
                "Expiry date cannot precede the joined date."
            )
        })

    member.expiry_date = expiry_date
    member.status = Member.Status.ACTIVE

    member.save(update_fields=[
        "expiry_date",
        "status",
        "updated_at",
    ])

    return member


@transaction.atomic
def suspend_membership(member):
    member = Member.objects.select_for_update().get(pk=member.pk)

    if member.status == Member.Status.CLOSED:
        raise ValidationError(
            "A closed membership cannot be suspended."
        )

    member.status = Member.Status.SUSPENDED
    member.save(update_fields=["status", "updated_at"])

    return member


@transaction.atomic
def close_membership(member):
    member = Member.objects.select_for_update().get(pk=member.pk)

    member.status = Member.Status.CLOSED
    member.save(update_fields=["status", "updated_at"])

    return member


def refresh_expired_memberships():
    """Mark active memberships past their expiry date as expired."""

    today = timezone.localdate()

    return Member.objects.filter(
        status=Member.Status.ACTIVE,
        expiry_date__lt=today,
    ).update(
        status=Member.Status.EXPIRED,
        updated_at=timezone.now(),
    )
