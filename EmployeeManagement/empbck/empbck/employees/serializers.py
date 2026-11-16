
import os
import re

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from rest_framework import serializers

from core.models import (
    EmergencyContact,
    Employee,
    EmployeeDocument,
    SystemSetting,
)


EmploymentStatus = Employee.EmploymentStatus


# =====================================================
# BUSINESS RULES
# =====================================================

MIN_EMPLOYEE_AGE = 18

MAX_FUTURE_JOIN_DAYS = 90

MAX_EMERGENCY_CONTACTS = 5

MAX_PHOTO_SIZE = 5 * 1024 * 1024

MAX_DOCUMENT_SIZE = 10 * 1024 * 1024

ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
}

EMPLOYEE_NUMBER_PATTERN = re.compile(
    r"^[A-Z0-9/_-]+$"
)


# =====================================================
# HELPERS
# =====================================================

def age_on(birth_date, on_date):
    """Calculate an employee's age in whole years."""

    years = on_date.year - birth_date.year

    if (on_date.month, on_date.day) < (
        birth_date.month,
        birth_date.day
    ):
        years -= 1

    return years


def is_in_chain(start_id, target_id):
    """
    Prevent circular employee management relationships.
    """

    current = start_id

    for _ in range(100):

        if current == target_id:
            return True

        current = (
            Employee.objects.filter(pk=current)
            .values_list("manager_id", flat=True)
            .first()
        )

        if current is None:
            return False

    return True


def generate_employee_number():
    """
    Automatically generate unique employee numbers.

    EMP-00001
    EMP-00002
    EMP-00003
    """

    setting, _ = (
        SystemSetting.objects.select_for_update()
        .get_or_create(
            key="employee_number_sequence",
            defaults={
                "value": {"last": 0},
                "description": "Last auto-generated employee number",
            },
        )
    )

    try:
        last = int(setting.value.get("last", 0))
    except (AttributeError, TypeError, ValueError):
        last = 0

    while True:

        last += 1

        number = f"EMP-{last:05d}"

        if not Employee.objects.filter(
            employee_number__iexact=number
        ).exists():
            break

    setting.value = {"last": last}

    setting.save(
        update_fields=["value", "updated_at"]
    )

    return number

# =====================================================
# EMERGENCY CONTACT
# =====================================================

class EmergencyContactSerializer(serializers.ModelSerializer):

    class Meta:
        model = EmergencyContact

        fields = [
            "id",
            "employee",
            "full_name",
            "relationship",
            "phone_number",
            "email",
            "address",
            "is_primary",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "employee",
            "created_at",
            "updated_at",
        ]

# =====================================================
# EMPLOYEE DOCUMENT
# =====================================================

class EmployeeDocumentSerializer(serializers.ModelSerializer):

    file_name = serializers.SerializerMethodField()

    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument

        fields = [
            "id",
            "employee",
            "title",
            "document_type",
            "file",
            "file_name",
            "description",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "employee",
            "uploaded_by",
            "created_at",
        ]

    def get_file_name(self, obj):

        return os.path.basename(obj.file.name) if obj.file else None

    def get_uploaded_by_name(self, obj):

        return (
            obj.uploaded_by.username
            if obj.uploaded_by_id
            else None
        )

    def validate_file(self, value):

        extension = os.path.splitext(value.name)[1].lower()

        if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type. Allowed: "
                f"{', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}."
            )

        if value.size > MAX_DOCUMENT_SIZE:
            raise serializers.ValidationError(
                "File too large. Maximum size is 10 MB."
            )

        return value

# =====================================================
# EMPLOYEE: WRITE (REGISTER / UPDATE)
# =====================================================

class EmployeeWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Employee

        fields = [
            "id",
            "employee_number",
            "first_name",
            "middle_name",
            "last_name",
            "email",
            "phone_number",
            "gender",
            "date_of_birth",
            "national_id",
            "address",
            "profile_photo",
            "department",
            "manager",
            "date_joined",
            "employment_status",
            "termination_date",
        ]

        read_only_fields = [
            "id",
            "termination_date",
        ]

        extra_kwargs = {
            "employee_number": {
                "required": False,
                "allow_blank": True,
            },
            "profile_photo": {
                "required": False,
                "allow_null": True,
            },
            "manager": {
                "required": False,
                "allow_null": True,
            },
        }

    # -------------------------------------------------
    # FIELD VALIDATION
    # -------------------------------------------------

    def validate_employee_number(self, value):

        value = value.strip().upper()

        if not value:
            return ""

        if not EMPLOYEE_NUMBER_PATTERN.match(value):
            raise serializers.ValidationError(
                "Employee number may only contain letters, "
                "numbers, '/', '-' and '_'."
            )

        duplicates = Employee.objects.filter(
            employee_number__iexact=value
        )

        if self.instance:
            duplicates = duplicates.exclude(
                pk=self.instance.pk
            )

        if duplicates.exists():
            raise serializers.ValidationError(
                "This employee number is already in use."
            )

        return value

    def validate_email(self, value):

        value = value.strip().lower()

        duplicates = Employee.objects.filter(
            email__iexact=value
        )

        if self.instance:
            duplicates = duplicates.exclude(
                pk=self.instance.pk
            )

        if duplicates.exists():
            raise serializers.ValidationError(
                "An employee with this email already exists."
            )

        return value

    def validate_national_id(self, value):

        value = value.strip()

        duplicates = Employee.objects.filter(
            national_id__iexact=value
        )

        if self.instance:
            duplicates = duplicates.exclude(
                pk=self.instance.pk
            )

        if duplicates.exists():
            raise serializers.ValidationError(
                "An employee with this national ID already exists."
            )

        return value

    def validate_date_of_birth(self, value):

        today = timezone.localdate()

        if value >= today:
            raise serializers.ValidationError(
                "Date of birth must be in the past."
            )

        if age_on(value, today) < MIN_EMPLOYEE_AGE:
            raise serializers.ValidationError(
                f"Employees must be at least "
                f"{MIN_EMPLOYEE_AGE} years old."
            )

        return value

    def validate_profile_photo(self, value):

        if value is not None and value.size > MAX_PHOTO_SIZE:
            raise serializers.ValidationError(
                "Photo too large. Maximum size is 5 MB."
            )

        return value

    def validate_employment_status(self, value):

        already_terminated = (
            self.instance is not None
            and self.instance.employment_status
            == EmploymentStatus.TERMINATED
        )

        if (
            value == EmploymentStatus.TERMINATED
            and not already_terminated
        ):
            raise serializers.ValidationError(
                "Use the terminate endpoint to terminate an employee."
            )

        return value

    # -------------------------------------------------
    # OBJECT VALIDATION
    # -------------------------------------------------

    def validate(self, attrs):

        instance = self.instance

        today = timezone.localdate()

        department = attrs.get(
            "department",
            getattr(instance, "department", None)
        )

        manager = attrs.get(
            "manager",
            getattr(instance, "manager", None)
        )

        date_joined = attrs.get(
            "date_joined",
            getattr(instance, "date_joined", None)
        )

        date_of_birth = attrs.get(
            "date_of_birth",
            getattr(instance, "date_of_birth", None)
        )

        # Department must be selected.
        if department is None:
            raise serializers.ValidationError({
                "department": "Please select a department."
            })

        # New assignments need an active department.
        if (
            instance is None
            or department.pk != instance.department_id
        ):
            if not department.is_active:
                raise serializers.ValidationError({
                    "department": (
                        "Employees cannot be assigned "
                        "to an inactive department."
                    )
                })

        # Join date validation.
        if date_joined is None:
            raise serializers.ValidationError({
                "date_joined": "Please provide a joining date."
            })

        if date_joined > today + timedelta(
            days=MAX_FUTURE_JOIN_DAYS
        ):
            raise serializers.ValidationError({
                "date_joined": (
                    f"Join date cannot be more than "
                    f"{MAX_FUTURE_JOIN_DAYS} days in the future."
                )
            })

        if (
            date_of_birth
            and age_on(date_of_birth, date_joined)
            < MIN_EMPLOYEE_AGE
        ):
            raise serializers.ValidationError({
                "date_joined": (
                    f"Employee must be at least "
                    f"{MIN_EMPLOYEE_AGE} on the join date."
                )
            })

        # Manager validation.
        if manager is not None:

            manager_changed = (
                instance is None
                or manager.pk != instance.manager_id
            )

            if (
                manager_changed
                and manager.employment_status
                == EmploymentStatus.TERMINATED
            ):
                raise serializers.ValidationError({
                    "manager": (
                        "A terminated employee cannot be a manager."
                    )
                })

            if (
                instance is not None
                and is_in_chain(manager.pk, instance.pk)
            ):
                raise serializers.ValidationError({
                    "manager": (
                        "This would create a reporting loop "
                        "or make the employee their own manager."
                    )
                })

        # Terminated employees must use the reactivate endpoint.
        if (
            instance is not None
            and instance.employment_status
            == EmploymentStatus.TERMINATED
            and attrs.get(
                "employment_status",
                EmploymentStatus.TERMINATED
            ) != EmploymentStatus.TERMINATED
        ):
            raise serializers.ValidationError({
                "employment_status": (
                    "Use the reactivate endpoint to "
                    "bring back a terminated employee."
                )
            })

        # Blank employee number on update means unchanged.
        if instance is not None and not attrs.get(
            "employee_number"
        ):
            attrs.pop("employee_number", None)

        return attrs

    # -------------------------------------------------
    # CREATE
    # -------------------------------------------------

    def create(self, validated_data):

        if not validated_data.get("employee_number"):
            validated_data["employee_number"] = (
                generate_employee_number()
            )

        return super().create(validated_data)

    # -------------------------------------------------
    # UPDATE
    # -------------------------------------------------

    def update(self, instance, validated_data):

        photo_field = instance._meta.get_field(
            "profile_photo"
        )

        old_photo = (
            instance.profile_photo.name
            if instance.profile_photo
            else None
        )

        instance = super().update(
            instance,
            validated_data
        )

        new_photo = (
            instance.profile_photo.name
            if instance.profile_photo
            else None
        )

        if old_photo and old_photo != new_photo:

            transaction.on_commit(
                lambda: photo_field.storage.delete(old_photo)
            )

        return instance

# =====================================================
# EMPLOYEE: LIST
# =====================================================

class EmployeeListSerializer(serializers.ModelSerializer):

    full_name = serializers.CharField(read_only=True)

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee

        fields = [
            "id",
            "employee_number",
            "full_name",
            "email",
            "phone_number",
            "gender",
            "department",
            "department_name",
            "manager",
            "manager_name",
            "employment_status",
            "date_joined",
            "profile_photo",
        ]

    def get_manager_name(self, obj):

        return (
            obj.manager.full_name
            if obj.manager_id
            else None
        )

# =====================================================
# EMPLOYEE: DETAIL
# =====================================================

class EmployeeDetailSerializer(serializers.ModelSerializer):

    full_name = serializers.CharField(read_only=True)

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    manager_name = serializers.SerializerMethodField()

    age = serializers.SerializerMethodField()

    years_of_service = serializers.SerializerMethodField()

    subordinate_count = serializers.IntegerField(
        read_only=True
    )

    emergency_contacts = EmergencyContactSerializer(
        many=True,
        read_only=True
    )

    documents = EmployeeDocumentSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Employee

        fields = [
            "id",
            "employee_number",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "email",
            "phone_number",
            "gender",
            "date_of_birth",
            "age",
            "national_id",
            "address",
            "profile_photo",
            "department",
            "department_name",
            "manager",
            "manager_name",
            "subordinate_count",
            "date_joined",
            "years_of_service",
            "employment_status",
            "termination_date",
            "emergency_contacts",
            "documents",
            "created_at",
            "updated_at",
        ]

    def get_manager_name(self, obj):

        return (
            obj.manager.full_name
            if obj.manager_id
            else None
        )

    def get_age(self, obj):

        return age_on(
            obj.date_of_birth,
            timezone.localdate()
        )

    def get_years_of_service(self, obj):

        end = (
            obj.termination_date
            or timezone.localdate()
        )

        if end < obj.date_joined:
            return 0

        return round(
            (end - obj.date_joined).days / 365.25,
            1
        )

# =====================================================
# TERMINATION
# =====================================================

class TerminateSerializer(serializers.Serializer):

    termination_date = serializers.DateField()

    new_manager = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        required=False,
        allow_null=True
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500
    )

    def validate_termination_date(self, value):

        employee = self.context["employee"]

        if value > timezone.localdate():
            raise serializers.ValidationError(
                "Termination date cannot be in the future."
            )

        if value < employee.date_joined:
            raise serializers.ValidationError(
                "Termination date cannot be before the join date."
            )

        return value

    def validate_new_manager(self, value):

        employee = self.context["employee"]

        if value is None:
            return value

        if (
            value.employment_status
            == EmploymentStatus.TERMINATED
        ):
            raise serializers.ValidationError(
                "The new manager cannot be a terminated employee."
            )

        if is_in_chain(value.pk, employee.pk):
            raise serializers.ValidationError(
                "The new manager cannot be the terminated "
                "employee or someone who reports to them."
            )

        return value
