
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from rest_framework import serializers

User = get_user_model()


# =====================================================
# USER SERIALIZER
# =====================================================

class UserSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone_number',
            'profile_picture',
            'is_email_verified',
            'date_joined',
        ]

        read_only_fields = [
            'id',
            'is_email_verified',
            'date_joined',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


# =====================================================
# REGISTRATION SERIALIZER
# =====================================================

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'password',
            'password_confirm',
        ]

        read_only_fields = ['id']

    def validate_email(self, value):

        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                'This email is already registered.'
            )

        return value

    def validate_username(self, value):

        value = value.strip()

        if User.objects.filter(
            username__iexact=value
        ).exists():

            raise serializers.ValidationError(
                'This username is already taken.'
            )

        return value

    def validate(self, attrs):

        if attrs['password'] != attrs['password_confirm']:

            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop('password_confirm')

        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            is_staff=False,
            is_superuser=False,
            **validated_data
        )

        return user


# =====================================================
# LOGIN SERIALIZER
# =====================================================

class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )


# =====================================================
# UPDATE PROFILE SERIALIZER
# =====================================================

class UpdateProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            'first_name',
            'last_name',
            'phone_number',
            'profile_picture',
        ]


# =====================================================
# CHANGE PASSWORD SERIALIZER
# =====================================================

class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    def validate_old_password(self, value):

        user = self.context['request'].user

        if not user.check_password(value):

            raise serializers.ValidationError(
                'Your current password is incorrect.'
            )

        return value

    def validate(self, attrs):

        if attrs['new_password'] != attrs['confirm_password']:

            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })

        try:

            validate_password(
                attrs['new_password'],
                self.context['request'].user
            )

        except ValidationError as exc:

            raise serializers.ValidationError({
                'new_password': exc.messages
            })

        return attrs

    def save(self):

        user = self.context['request'].user

        user.set_password(
            self.validated_data['new_password']
        )

        user.save(update_fields=['password'])

        return user
