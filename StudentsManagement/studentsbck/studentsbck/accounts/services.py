
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


# ============================================================
# ACCOUNT SERVICES
# ============================================================

@transaction.atomic
def create_user(validated_data):
    """
    Create a new user account.
    """

    password = validated_data.pop("password")

    user = User.objects.create_user(
        password=password,
        **validated_data
    )

    return user


@transaction.atomic
def deactivate_user(user):
    """
    Deactivate a user account without deleting its records.
    """

    user.is_active = False

    user.save(update_fields=["is_active"])

    return user


@transaction.atomic
def activate_user(user):
    """
    Reactivate a user account.
    """

    user.is_active = True

    user.save(update_fields=["is_active"])

    return user


@transaction.atomic
def update_user_password(user, new_password):
    """
    Update a user's password securely.
    """

    user.set_password(new_password)

    user.save(update_fields=["password"])

    return user
