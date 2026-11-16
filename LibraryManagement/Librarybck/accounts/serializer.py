from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "password_confirm",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        value = value.strip().lower()

        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm": "Passwords do not match."
            })

        user = User(
            username=attrs.get("username"),
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )

        try:
            password_validation.validate_password(
                attrs["password"],
                user=user,
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({
                "password": list(exc.messages)
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "date_joined",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "username",
            "date_joined",
            "last_login",
        ]

    def validate_email(self, value):
        value = value.strip().lower()

        exists = User.objects.filter(
            email__iexact=value
        ).exclude(pk=self.instance.pk).exists()

        if value and exists:
            raise serializers.ValidationError(
                "This email address is already in use."
            )

        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user

        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({
                "current_password": "The current password is incorrect."
            })

        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        try:
            password_validation.validate_password(
                attrs["new_password"],
                user=user,
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({
                "new_password": list(exc.messages)
            })

        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Used only by authorized staff to manage user accounts.
    Passwords are never exposed through this serializer.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "username",
            "date_joined",
            "last_login",
        ]
