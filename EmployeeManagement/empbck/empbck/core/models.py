"""
core/models.py

Works on Django 4.2+ (including 5.1, 5.2 and 6.x).
In settings.py:  AUTH_USER_MODEL = "core.User"
Set AUTH_USER_MODEL BEFORE running the first migration.
Requires Pillow (ImageField):  pip install Pillow
"""

import uuid
from decimal import Decimal

import django
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


phone_validator = RegexValidator(
    regex=r"^\+?[0-9\s\-]{7,20}$",
    message="Enter a valid phone number (digits, spaces, dashes, optional leading +).",
)


def check_constraint(condition, name):
    """
    CheckConstraint compatibility helper.
    Django 5.1 renamed `check=` to `condition=` (and 6.0 removed `check=`),
    so pick the right keyword for the installed version.
    """
    if django.VERSION >= (5, 1):
        return models.CheckConstraint(condition=condition, name=name)
    return models.CheckConstraint(check=condition, name=name)


# ============================================================
# 1. ABSTRACT BASE MODELS
# ============================================================

class BaseModel(models.Model):
    """Common timestamps for all models."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDModel(BaseModel):
    """Timestamps + UUID primary key, so every model is consistent."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


# ============================================================
# 2. USER MODEL (admin only)
# ============================================================

class User(AbstractUser, BaseModel):
    """
    The only account type in the system: the administrator.
    Keeps Django's integer PK (safer for admin/session/third-party apps).
    """

    phone_number = models.CharField(
        max_length=20, blank=True, validators=[phone_validator]
    )

    def save(self, *args, **kwargs):
        # Everyone who can log in to this system is an admin.
        self.is_staff = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


# ============================================================
# 3. DEPARTMENT
# ============================================================

class Department(UUIDModel):

    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


# ============================================================
# 5. EMPLOYEE
# ============================================================

class Employee(UUIDModel):

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    class EmploymentStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ON_LEAVE = "ON_LEAVE", "On Leave"
        TERMINATED = "TERMINATED", "Terminated"

    employee_number = models.CharField(max_length=30, unique=True)

    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, validators=[phone_validator])

    gender = models.CharField(max_length=10, choices=Gender.choices)
    date_of_birth = models.DateField()
    national_id = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)

    profile_photo = models.ImageField(
        upload_to="employees/profiles/", blank=True, null=True
    )

    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="employees"
    )
    
    manager = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subordinates",
    )

    date_joined = models.DateField()

    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
    )
    termination_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=["employment_status"]),
            models.Index(fields=["date_joined"]),
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["department", "employment_status"]),
        ]
        constraints = [
            check_constraint(
                Q(termination_date__isnull=True)
                | Q(termination_date__gte=F("date_joined")),
                "employee_termination_after_joining",
            ),
            check_constraint(
                Q(manager__isnull=True) | ~Q(manager=F("pk")),
                "employee_not_own_manager",
            ),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.employee_number})"

    @property
    def full_name(self):
        return " ".join(
            p for p in [self.first_name, self.middle_name, self.last_name] if p
        )

    def clean(self):
        errors = {}
        today = timezone.localdate()

        if self.date_of_birth and self.date_of_birth >= today:
            errors["date_of_birth"] = "Date of birth must be in the past."

        
        if self.manager_id and self.manager_id == self.pk:
            errors["manager"] = "An employee cannot be their own manager."

        if self.employment_status == self.EmploymentStatus.TERMINATED:
            if not self.termination_date:
                errors["termination_date"] = "Termination date is required for terminated employees."
        elif self.termination_date:
            errors["termination_date"] = "Only terminated employees can have a termination date."

        if errors:
            raise ValidationError(errors)


# ============================================================
# 6. EMERGENCY CONTACT
# ============================================================

class EmergencyContact(UUIDModel):

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="emergency_contacts"
    )
    full_name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20, validators=[phone_validator])
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_primary", "full_name"]
        constraints = [
            # at most one primary contact per employee
            models.UniqueConstraint(
                fields=["employee"],
                condition=Q(is_primary=True),
                name="one_primary_contact_per_employee",
            )
        ]

    def __str__(self):
        return f"{self.full_name} - {self.employee.full_name}"


# ============================================================
# 7. EMPLOYEE DOCUMENT
# ============================================================

class EmployeeDocument(UUIDModel):

    class DocumentType(models.TextChoices):
        NATIONAL_ID = "NATIONAL_ID", "National ID"
        PASSPORT = "PASSPORT", "Passport"
        CONTRACT = "CONTRACT", "Employment Contract"
        CERTIFICATE = "CERTIFICATE", "Certificate"
        CV = "CV", "Curriculum Vitae"
        OTHER = "OTHER", "Other"

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField(max_length=150)
    document_type = models.CharField(
        max_length=30, choices=DocumentType.choices, default=DocumentType.OTHER
    )
    file = models.FileField(upload_to="employees/documents/%Y/%m/")
    description = models.TextField(blank=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_documents",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["employee", "document_type"])]

    def __str__(self):
        return f"{self.title} - {self.employee.full_name}"


# ============================================================
# 8. ATTENDANCE
# ============================================================

class Attendance(UUIDModel):

    class AttendanceStatus(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"
        HALF_DAY = "HALF_DAY", "Half Day"
        ON_LEAVE = "ON_LEAVE", "On Leave"

    employee = models.ForeignKey(
        Employee, on_delete=models.PROTECT, related_name="attendance_records"
    )
    attendance_date = models.DateField(default=timezone.localdate)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT,
    )
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-attendance_date"]
        constraints = [
            # also creates the (employee, attendance_date) index
            models.UniqueConstraint(
                fields=["employee", "attendance_date"],
                name="unique_employee_attendance_per_day",
            ),
            check_constraint(
                Q(check_in__isnull=True)
                | Q(check_out__isnull=True)
                | Q(check_out__gte=F("check_in")),
                "attendance_checkout_after_checkin",
            ),
        ]
        indexes = [models.Index(fields=["attendance_date", "status"])]

    def __str__(self):
        return f"{self.employee.full_name} - {self.attendance_date}"


# ============================================================
# 9. LEAVE TYPE
# ============================================================

class LeaveType(UUIDModel):

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    default_days = models.PositiveIntegerField(default=0)
    is_paid = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


# ============================================================
# 10. LEAVE REQUEST
# ============================================================

class LeaveRequest(UUIDModel):

    class LeaveStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    employee = models.ForeignKey(
        Employee, on_delete=models.PROTECT, related_name="leave_requests"
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name="leave_requests"
    )

    start_date = models.DateField()
    end_date = models.DateField()

    # Decimal (not integer) so half-days (0.5) are possible and the value
    # matches LeaveBalance.used_days, which is a Decimal.
    days_requested = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.5"))],
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20, choices=LeaveStatus.choices, default=LeaveStatus.PENDING
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leave_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["status", "created_at"]),
        ]
        constraints = [
            check_constraint(
                Q(end_date__gte=F("start_date")),
                "leave_end_on_or_after_start",
            )
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name}"


# ============================================================
# 11. LEAVE BALANCE
# ============================================================

class LeaveBalance(UUIDModel):

    employee = models.ForeignKey(
        Employee, on_delete=models.PROTECT, related_name="leave_balances"
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name="balances"
    )
    year = models.PositiveIntegerField()

    allocated_days = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    used_days = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )

    class Meta:
        ordering = ["-year", "leave_type__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "leave_type", "year"],
                name="unique_employee_leave_balance_year",
            )
        ]

    @property
    def remaining_days(self):
        return self.allocated_days - self.used_days

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name} ({self.year})"


# ============================================================
# 12. SALARY STRUCTURE
# ============================================================

class SalaryStructure(UUIDModel):

    employee = models.ForeignKey(
        Employee, on_delete=models.PROTECT, related_name="salary_structures"
    )

    basic_salary = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    allowances = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    deductions = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )

    currency = models.CharField(max_length=3, default="KES")

    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-effective_from"]
        constraints = [
            check_constraint(
                Q(effective_to__isnull=True)
                | Q(effective_to__gte=F("effective_from")),
                "salary_effective_to_after_from",
            ),
            # only one active structure per employee at a time
            models.UniqueConstraint(
                fields=["employee"],
                condition=Q(is_active=True),
                name="one_active_salary_structure_per_employee",
            ),
            check_constraint(
                Q(deductions__lte=F("basic_salary") + F("allowances")),
                "salary_deductions_not_above_gross",
            ),
        ]

    @property
    def gross_salary(self):
        return self.basic_salary + self.allowances

    @property
    def net_salary(self):
        return self.gross_salary - self.deductions

    def __str__(self):
        return f"{self.employee.full_name} - {self.basic_salary}"


# ============================================================
# 13. PAYROLL
# ============================================================

class Payroll(UUIDModel):
    """
    Payroll rows are snapshots of the salary structure at processing time,
    so figures are stored (not computed) to keep history accurate.
    """

    class PayrollStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSED = "PROCESSED", "Processed"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    employee = models.ForeignKey(
        Employee, on_delete=models.PROTECT, related_name="payroll_records"
    )
    salary_structure = models.ForeignKey(
        SalaryStructure, on_delete=models.PROTECT, related_name="payroll_records"
    )

    pay_period_start = models.DateField()
    pay_period_end = models.DateField()

    basic_salary = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    allowances = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    deductions = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    gross_salary = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)

    currency = models.CharField(max_length=3, default="KES")

    payment_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=PayrollStatus.choices, default=PayrollStatus.PENDING
    )

    reference_number = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-pay_period_start"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "pay_period_start", "pay_period_end"],
                name="unique_employee_payroll_period",
            ),
            check_constraint(
                Q(pay_period_end__gte=F("pay_period_start")),
                "payroll_period_end_after_start",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "pay_period_start"]),
            models.Index(fields=["pay_period_start", "pay_period_end"]),
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.pay_period_start}"


# ============================================================
# 14. AUDIT LOG
# ============================================================

class AuditLog(UUIDModel):

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        EXPORT = "EXPORT", "Export"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["model_name", "object_id"]),
        ]

    def __str__(self):
        return f"{self.action} - {self.model_name}"

    def save(self, *args, **kwargs):
        # Audit entries are append-only.
        if not self._state.adding:
            raise ValidationError("Audit log entries cannot be modified.")
        super().save(*args, **kwargs)


# ============================================================
# 15. SYSTEM SETTINGS
# ============================================================

class SystemSetting(UUIDModel):

    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["key"]

    def __str__(self):
        return self.key