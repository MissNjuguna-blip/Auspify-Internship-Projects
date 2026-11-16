
import re

from rest_framework import serializers

from core.models import Department, Employee


# Employees who still count towards a department's headcount.
NON_TERMINATED = [
    Employee.EmploymentStatus.ACTIVE,
    Employee.EmploymentStatus.ON_LEAVE,
    Employee.EmploymentStatus.INACTIVE,
]

CODE_PATTERN = re.compile(r"^[A-Z0-9_-]+$")


def clean_code(value, model, instance=None):
    """Upper-case, validate format and enforce case-insensitive uniqueness."""
    value = value.strip().upper()

    if not CODE_PATTERN.fullmatch(value):
        raise serializers.ValidationError(
            "Code may only contain letters, numbers, hyphens and underscores."
        )

    duplicates = model.objects.filter(code__iexact=value)

    if instance:
        duplicates = duplicates.exclude(pk=instance.pk)

    if duplicates.exists():
        raise serializers.ValidationError(
            "This code is already in use."
        )

    return value

# =====================================================
# DEPARTMENT
# =====================================================

class DepartmentSerializer(serializers.ModelSerializer):

    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department

        fields = [
            "id",
            "name",
            "code",
            "description",
            "is_active",
            "employee_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = " ".join(value.split())

        duplicates = Department.objects.filter(
            name__iexact=value
        )

        if self.instance:
            duplicates = duplicates.exclude(
                pk=self.instance.pk
            )

        if duplicates.exists():
            raise serializers.ValidationError(
                "A department with this name already exists."
            )

        return value

    def validate_code(self, value):
        return clean_code(
            value,
            Department,
            self.instance
        )

    def validate(self, attrs):

        # Prevent deactivating a department with current employees.
        if (
            self.instance
            and self.instance.is_active
            and attrs.get("is_active") is False
        ):

            staff = Employee.objects.filter(
                department=self.instance,
                employment_status__in=NON_TERMINATED,
            ).count()

            if staff:
                raise serializers.ValidationError({
                    "is_active": (
                        f"Cannot deactivate a department with {staff} "
                        "current employee(s). Move or terminate them first."
                    )
                })

        return attrs

# =====================================================
# DEPARTMENT DETAIL
# =====================================================

class DepartmentDetailSerializer(DepartmentSerializer):
    pass

# =====================================================
# DEPARTMENT EMPLOYEES
# =====================================================

class DepartmentEmployeeSerializer(serializers.ModelSerializer):

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee

        fields = [
            "id",
            "employee_number",
            "full_name",
            "email",
            "phone_number",
            "employment_status",
            "date_joined",
        ]
