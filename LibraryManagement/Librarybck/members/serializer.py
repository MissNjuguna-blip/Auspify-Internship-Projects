from django.utils import timezone
from rest_framework import serializers
from core.models import Member


class MemberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    membership_valid = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            "id",
            "membership_number",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone_number",
            "date_of_birth",
            "membership_type",
            "status",
            "address",
            "joined_date",
            "expiry_date",
            "emergency_contact_name",
            "emergency_contact_phone",
            "membership_valid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "membership_valid",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_membership_valid(self, obj):
        today = timezone.localdate()

        return (
            obj.status == Member.Status.ACTIVE
            and (
                obj.expiry_date is None
                or obj.expiry_date >= today
            )
        )

    def validate_membership_number(self, value):
        value = value.strip()

        queryset = Member.objects.filter(
            membership_number__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "This membership number is already registered."
            )

        return value

    def validate(self, attrs):
        joined_date = attrs.get(
            "joined_date",
            getattr(self.instance, "joined_date", timezone.localdate()),
        )

        expiry_date = attrs.get(
            "expiry_date",
            getattr(self.instance, "expiry_date", None),
        )

        date_of_birth = attrs.get(
            "date_of_birth",
            getattr(self.instance, "date_of_birth", None),
        )

        if expiry_date and expiry_date < joined_date:
            raise serializers.ValidationError({
                "expiry_date": (
                    "Expiry date cannot be earlier than the joined date."
                )
            })

        if date_of_birth and date_of_birth > timezone.localdate():
            raise serializers.ValidationError({
                "date_of_birth": "Date of birth cannot be in the future."
            })

        return attrs