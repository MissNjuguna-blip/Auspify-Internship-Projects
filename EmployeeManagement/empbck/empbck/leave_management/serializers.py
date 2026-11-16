
from decimal import Decimal

from rest_framework import serializers

from core.models import (
    Employee,
    LeaveType,
    LeaveRequest,
    LeaveBalance,
)


# ============================================================
# 1. LEAVE TYPE SERIALIZER
# ============================================================

class LeaveTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = LeaveType
        fields = [
            "id",
            "name",
            "description",
            "default_days",
            "is_paid",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_default_days(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Default leave days cannot be negative."
            )
        return value


# ============================================================
# 2. LEAVE REQUEST SERIALIZER
# ============================================================

class LeaveRequestSerializer(serializers.ModelSerializer):

    employee_name = serializers.CharField(
        source="employee.full_name",
        read_only=True
    )

    employee_number = serializers.CharField(
        source="employee.employee_number",
        read_only=True
    )

    leave_type_name = serializers.CharField(
        source="leave_type.name",
        read_only=True
    )

    reviewed_by_name = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_number",
            "leave_type",
            "leave_type_name",
            "start_date",
            "end_date",
            "days_requested",
            "reason",
            "status",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "review_comment",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_comment",
            "created_at",
            "updated_at",
        ]

    def validate_days_requested(self, value):
        if value < Decimal("0.5"):
            raise serializers.ValidationError(
                "Leave duration must be at least half a day."
            )
        return value

    def validate(self, attrs):

        instance = self.instance

        employee = attrs.get(
            "employee",
            instance.employee if instance else None
        )

        leave_type = attrs.get(
            "leave_type",
            instance.leave_type if instance else None
        )

        start_date = attrs.get(
            "start_date",
            instance.start_date if instance else None
        )

        end_date = attrs.get(
            "end_date",
            instance.end_date if instance else None
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "End date cannot be earlier than start date."
            })

        if employee and employee.employment_status != Employee.EmploymentStatus.ACTIVE:
            raise serializers.ValidationError({
                "employee": "Only active employees can apply for leave."
            })

        if leave_type and not leave_type.is_active:
            raise serializers.ValidationError({
                "leave_type": "This leave type is currently inactive."
            })

        if employee and start_date and end_date:

            overlapping = LeaveRequest.objects.filter(
                employee=employee,
                status__in=[
                    LeaveRequest.LeaveStatus.PENDING,
                    LeaveRequest.LeaveStatus.APPROVED,
                ],
                start_date__lte=end_date,
                end_date__gte=start_date,
            )

            if instance:
                overlapping = overlapping.exclude(pk=instance.pk)

            if overlapping.exists():
                raise serializers.ValidationError({
                    "start_date": (
                        "This employee already has a pending or approved "
                        "leave request covering these dates."
                    )
                })

        return attrs


# ============================================================
# 3. LEAVE BALANCE SERIALIZER
# ============================================================

class LeaveBalanceSerializer(serializers.ModelSerializer):

    employee_name = serializers.CharField(
        source="employee.full_name",
        read_only=True
    )

    employee_number = serializers.CharField(
        source="employee.employee_number",
        read_only=True
    )

    leave_type_name = serializers.CharField(
        source="leave_type.name",
        read_only=True
    )

    remaining_days = serializers.DecimalField(
        max_digits=7,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = LeaveBalance
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_number",
            "leave_type",
            "leave_type_name",
            "year",
            "allocated_days",
            "used_days",
            "remaining_days",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "used_days",
            "created_at",
            "updated_at",
        ]

    def validate_allocated_days(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Allocated leave days cannot be negative."
            )
        return value

    def validate(self, attrs):

        employee = attrs.get(
            "employee",
            self.instance.employee if self.instance else None
        )

        leave_type = attrs.get(
            "leave_type",
            self.instance.leave_type if self.instance else None
        )

        year = attrs.get(
            "year",
            self.instance.year if self.instance else None
        )

        if self.instance and "allocated_days" in attrs:
            if attrs["allocated_days"] < self.instance.used_days:
                raise serializers.ValidationError({
                    "allocated_days": (
                        "Allocated days cannot be less than days already used."
                    )
                })

        if employee and leave_type and year:
            duplicate = LeaveBalance.objects.filter(
                employee=employee,
                leave_type=leave_type,
                year=year,
            )

            if self.instance:
                duplicate = duplicate.exclude(pk=self.instance.pk)

            if duplicate.exists():
                raise serializers.ValidationError(
                    "A leave balance already exists for this employee, "
                    "leave type and year."
                )

        return attrs
