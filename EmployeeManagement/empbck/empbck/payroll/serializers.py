import re
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from core.models import Employee, Payroll, SalaryStructure

EmploymentStatus = Employee.EmploymentStatus

# ---------------------------------------------------------------
# Business rules (adjust to your policy)
# ---------------------------------------------------------------
MAX_PERIOD_DAYS = 31          # one payroll period is at most a month
MAX_BULK_IDS = 500
MAX_GENERATE_EMPLOYEES = 1000

CURRENCY_PATTERN = re.compile(r"^[A-Z]{3}$")

# Once a (non-cancelled) payroll was produced from a salary structure,
# its money fields are frozen. Pay changes are made with a NEW structure.
STRUCTURE_LOCKED_FIELDS = (
    "basic_salary",
    "allowances",
    "deductions",
    "currency",
    "effective_from",
)


# =====================================================
# SALARY STRUCTURE
# =====================================================

class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_number = serializers.CharField(source="employee.employee_number", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    gross_salary = serializers.DecimalField(max_digits=13, decimal_places=2, read_only=True)
    net_salary = serializers.DecimalField(max_digits=13, decimal_places=2, read_only=True)

    class Meta:
        model = SalaryStructure
        fields = [
            "id",
            "employee",
            "employee_number",
            "employee_name",
            "department",
            "basic_salary",
            "allowances",
            "deductions",
            "gross_salary",
            "net_salary",
            "currency",
            "effective_from",
            "effective_to",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_currency(self, value):
        value = value.strip().upper()
        if not CURRENCY_PATTERN.match(value):
            raise serializers.ValidationError("Currency must be a 3-letter code such as KES.")
        return value

    def validate(self, attrs):
        instance = self.instance

        employee = attrs.get("employee", getattr(instance, "employee", None))

        if instance and "employee" in attrs and attrs["employee"].pk != instance.employee_id:
            raise serializers.ValidationError(
                {"employee": "The employee of a salary structure cannot be changed."}
            )

        if instance is None and employee.employment_status == EmploymentStatus.TERMINATED:
            raise serializers.ValidationError(
                {"employee": "Cannot create a salary structure for a terminated employee."}
            )

        basic = attrs.get("basic_salary", getattr(instance, "basic_salary", Decimal("0")))
        allowances = attrs.get("allowances", getattr(instance, "allowances", Decimal("0")))
        deductions = attrs.get("deductions", getattr(instance, "deductions", Decimal("0")))
        effective_from = attrs.get("effective_from", getattr(instance, "effective_from", None))
        effective_to = attrs.get("effective_to", getattr(instance, "effective_to", None))
        is_active = attrs.get("is_active", getattr(instance, "is_active", True))

        if deductions > basic + allowances:
            raise serializers.ValidationError(
                {"deductions": "Deductions cannot be more than gross salary (basic + allowances)."}
            )

        if effective_to and effective_to < effective_from:
            raise serializers.ValidationError(
                {"effective_to": "End date cannot be before the effective-from date."}
            )

        # Money fields are frozen once payroll has been produced from this structure.
        if instance is not None:
            has_payroll = instance.payroll_records.exclude(
                status=Payroll.PayrollStatus.CANCELLED
            ).exists()
            if has_payroll:
                changed = [
                    f for f in STRUCTURE_LOCKED_FIELDS
                    if f in attrs and attrs[f] != getattr(instance, f)
                ]
                if changed:
                    raise serializers.ValidationError(
                        {
                            "non_field_errors": [
                                f"Payroll already exists for this structure, so {', '.join(changed)} "
                                "cannot be changed. Create a new salary structure instead."
                            ]
                        }
                    )

        # Only one active structure per employee. A NEW active structure replaces
        # the current one (the view closes it); it must start after the old one.
        previous = None
        if is_active:
            current = SalaryStructure.objects.filter(employee=employee, is_active=True)
            if instance:
                current = current.exclude(pk=instance.pk)
            previous = current.first()

            if previous and instance is not None:
                raise serializers.ValidationError(
                    {"is_active": "This employee already has an active salary structure."}
                )
            if previous and effective_from <= previous.effective_from:
                raise serializers.ValidationError(
                    {
                        "effective_from": (
                            f"Must be after the current structure's start date "
                            f"({previous.effective_from})."
                        )
                    }
                )

        # No overlapping periods (the structure being replaced is excluded).
        others = SalaryStructure.objects.filter(employee=employee)
        if instance:
            others = others.exclude(pk=instance.pk)
        if previous and instance is None:
            others = others.exclude(pk=previous.pk)

        others = others.filter(Q(effective_to__isnull=True) | Q(effective_to__gte=effective_from))
        if effective_to:
            others = others.filter(effective_from__lte=effective_to)
        if others.exists():
            raise serializers.ValidationError(
                "This period overlaps another salary structure of the same employee."
            )

        return attrs


# =====================================================
# PAYROLL (READ)
# =====================================================

class PayrollSerializer(serializers.ModelSerializer):
    employee_number = serializers.CharField(source="employee.employee_number", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Payroll
        fields = [
            "id",
            "employee",
            "employee_number",
            "employee_name",
            "department",
            "salary_structure",
            "pay_period_start",
            "pay_period_end",
            "basic_salary",
            "allowances",
            "deductions",
            "gross_salary",
            "net_salary",
            "currency",
            "payment_date",
            "status",
            "status_display",
            "reference_number",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# =====================================================
# PAYROLL (ADJUST A PENDING RECORD)
# =====================================================

class PayrollAdjustSerializer(serializers.Serializer):
    """Corrections to a PENDING payroll (e.g. add overtime or a one-off deduction)."""

    basic_salary = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    allowances = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    deductions = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0, required=False)
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Provide at least one field to adjust.")

        payroll = self.context["payroll"]
        basic = attrs.get("basic_salary", payroll.basic_salary)
        allowances = attrs.get("allowances", payroll.allowances)
        deductions = attrs.get("deductions", payroll.deductions)

        if deductions > basic + allowances:
            raise serializers.ValidationError(
                {"deductions": "Deductions cannot be more than gross salary (basic + allowances)."}
            )
        return attrs


# =====================================================
# PAYROLL GENERATION
# =====================================================

class GeneratePayrollSerializer(serializers.Serializer):
    pay_period_start = serializers.DateField()
    pay_period_end = serializers.DateField()
    # Optional scope: specific employees OR one department (default: everyone eligible)
    employees = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=False,
        max_length=MAX_GENERATE_EMPLOYEES,
    )
    department = serializers.UUIDField(required=False)
    deduct_unpaid_leave = serializers.BooleanField(required=False, default=True)
    dry_run = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        start = attrs["pay_period_start"]
        end = attrs["pay_period_end"]

        if end < start:
            raise serializers.ValidationError(
                {"pay_period_end": "Period end cannot be before the period start."}
            )
        if (end - start).days + 1 > MAX_PERIOD_DAYS:
            raise serializers.ValidationError(
                {"pay_period_end": f"A pay period cannot be longer than {MAX_PERIOD_DAYS} days."}
            )
        if start > timezone.localdate():
            raise serializers.ValidationError(
                {"pay_period_start": "Payroll cannot be generated for a period that has not started."}
            )
        if attrs.get("employees") and attrs.get("department"):
            raise serializers.ValidationError("Provide either 'employees' or 'department', not both.")

        if attrs.get("employees"):
            attrs["employees"] = list(dict.fromkeys(attrs["employees"]))  # de-duplicate

        return attrs


# =====================================================
# STATUS CHANGES
# =====================================================

class PaySerializer(serializers.Serializer):
    payment_date = serializers.DateField()
    reference_number = serializers.CharField(max_length=100)

    def validate_payment_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Payment date cannot be in the future.")
        return value

    def validate_reference_number(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("A payment reference is required.")
        return value


class CancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=300)


class BulkActionSerializer(serializers.Serializer):
    ACTIONS = ("process", "pay", "cancel")

    action = serializers.ChoiceField(choices=ACTIONS)
    ids = serializers.ListField(
        child=serializers.UUIDField(), allow_empty=False, max_length=MAX_BULK_IDS
    )
    # required only for action=pay
    payment_date = serializers.DateField(required=False)
    reference_number = serializers.CharField(required=False, max_length=100)
    # optional for action=cancel
    reason = serializers.CharField(required=False, allow_blank=True, max_length=300)

    def validate(self, attrs):
        attrs["ids"] = list(dict.fromkeys(attrs["ids"]))

        if attrs["action"] == "pay":
            errors = {}
            payment_date = attrs.get("payment_date")
            reference = (attrs.get("reference_number") or "").strip()

            if not payment_date:
                errors["payment_date"] = "Required when action is 'pay'."
            elif payment_date > timezone.localdate():
                errors["payment_date"] = "Payment date cannot be in the future."
            if not reference:
                errors["reference_number"] = "Required when action is 'pay'."
            if errors:
                raise serializers.ValidationError(errors)

            attrs["reference_number"] = reference

        return attrs