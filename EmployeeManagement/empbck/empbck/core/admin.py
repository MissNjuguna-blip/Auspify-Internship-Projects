from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone

from core.models import (
    User,
    Department,
    Employee,
    EmergencyContact,
    EmployeeDocument,
    Attendance,
    LeaveType,
    LeaveRequest,
    LeaveBalance,
    SalaryStructure,
    Payroll,
    AuditLog,
    SystemSetting,
)
# ============================================================
# USER
# ============================================================

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Additional Information", {"fields": ("phone_number",)}),
    )
    # also show phone number on the "add user" page
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Additional Information", {"fields": ("email", "phone_number")}),
    )

    list_display = ("username", "email", "phone_number", "is_staff", "is_superuser", "is_active")
    list_filter = ("is_superuser", "is_active")
    search_fields = ("username", "email", "phone_number")


# ============================================================
# DEPARTMENT / POSITION
# ============================================================

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")
    search_fields = ("name", "code")
    list_filter = ("is_active",)
    ordering = ("name",)

# ============================================================
# EMPLOYEE (with inlines)
# ============================================================

class EmergencyContactInline(admin.TabularInline):
    model = EmergencyContact
    extra = 0
    fields = ("full_name", "relationship", "phone_number", "email", "is_primary")


class EmployeeDocumentInline(admin.TabularInline):
    model = EmployeeDocument
    extra = 0
    fields = ("title", "document_type", "file", "description", "uploaded_by")
    readonly_fields = ("uploaded_by",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "employee_number",
        "full_name",
        "department",
        "employment_status",
        "date_joined",
    )
    list_select_related = ("department", "manager")
    search_fields = (
        "employee_number",
        "first_name",
        "last_name",
        "email",
        "national_id",
        "phone_number",
    )
    list_filter = ("department", "employment_status", "gender", "date_joined")
    date_hierarchy = "date_joined"
    ordering = ("first_name", "last_name")
    list_per_page = 50

    autocomplete_fields = ("department","manager")
    readonly_fields = ("created_at", "updated_at")
    inlines = [EmergencyContactInline, EmployeeDocumentInline]
    actions = ["mark_as_terminated"]

    fieldsets = (
        ("Personal", {"fields": (
            "employee_number", "first_name", "middle_name", "last_name",
            "gender", "date_of_birth", "national_id", "profile_photo",
        )}),
        ("Contact", {"fields": ("email", "phone_number", "address")}),
        ("Employment", {"fields": (
            "department", "position", "manager", "date_joined",
            "employment_status", "termination_date",
        )}),
        ("System", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Name", ordering="first_name")
    def full_name(self, obj):
        return obj.full_name

    # Employees own protected history (attendance, leave, payroll),
    # so they are terminated rather than deleted.
    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Mark selected employees as terminated")
    def mark_as_terminated(self, request, queryset):
        today = timezone.localdate()
        updated = (
            queryset.exclude(employment_status=Employee.EmploymentStatus.TERMINATED)
            .filter(date_joined__lte=today)
            .update(
                employment_status=Employee.EmploymentStatus.TERMINATED,
                termination_date=today,
                updated_at=timezone.now(),
            )
        )
        self.message_user(request, f"{updated} employee(s) marked as terminated.", messages.SUCCESS)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in formset.deleted_objects:
            obj.delete()
        for instance in instances:
            if isinstance(instance, EmployeeDocument) and not instance.uploaded_by_id:
                instance.uploaded_by = request.user
            instance.save()
        formset.save_m2m()


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ("full_name", "employee", "relationship", "phone_number", "is_primary")
    list_select_related = ("employee",)
    search_fields = ("full_name", "phone_number", "employee__first_name", "employee__last_name")
    list_filter = ("is_primary",)
    autocomplete_fields = ("employee",)


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "employee", "document_type", "uploaded_by", "created_at")
    list_select_related = ("employee", "uploaded_by")
    search_fields = ("title", "employee__first_name", "employee__last_name", "employee__employee_number")
    list_filter = ("document_type", "created_at")
    autocomplete_fields = ("employee",)
    readonly_fields = ("uploaded_by",)

    def save_model(self, request, obj, form, change):
        if not obj.uploaded_by_id:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


# ============================================================
# ATTENDANCE
# ============================================================

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "attendance_date", "check_in", "check_out", "status")
    list_select_related = ("employee",)
    list_filter = ("status", "attendance_date")
    search_fields = (
        "employee__first_name",
        "employee__last_name",
        "employee__employee_number",
    )
    date_hierarchy = "attendance_date"
    autocomplete_fields = ("employee",)
    list_per_page = 50


# ============================================================
# LEAVE
# ============================================================

@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "default_days", "is_paid", "is_active")
    search_fields = ("name",)
    list_filter = ("is_paid", "is_active")


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "start_date", "end_date", "days_requested", "status")
    list_select_related = ("employee", "leave_type")
    list_filter = ("status", "leave_type", "start_date")
    search_fields = (
        "employee__first_name",
        "employee__last_name",
        "employee__employee_number",
    )
    date_hierarchy = "start_date"
    autocomplete_fields = ("employee", "leave_type")
    readonly_fields = ("reviewed_by", "reviewed_at")

    def save_model(self, request, obj, form, change):
        # stamp the reviewer when the status leaves PENDING
        if change and "status" in form.changed_data and obj.status != LeaveRequest.LeaveStatus.PENDING:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "year", "allocated_days", "used_days", "remaining")
    list_select_related = ("employee", "leave_type")
    list_filter = ("year", "leave_type")
    search_fields = (
        "employee__first_name",
        "employee__last_name",
        "employee__employee_number",
    )
    autocomplete_fields = ("employee", "leave_type")

    @admin.display(description="Remaining")
    def remaining(self, obj):
        return obj.remaining_days


# ============================================================
# SALARY / PAYROLL
# ============================================================

@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = (
        "employee", "basic_salary", "allowances", "deductions",
        "gross", "net", "currency", "effective_from", "is_active",
    )
    list_select_related = ("employee",)
    list_filter = ("is_active", "currency")
    search_fields = (
        "employee__first_name",
        "employee__last_name",
        "employee__employee_number",
    )
    autocomplete_fields = ("employee",)

    @admin.display(description="Gross")
    def gross(self, obj):
        return obj.gross_salary

    @admin.display(description="Net")
    def net(self, obj):
        return obj.net_salary


@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = (
        "employee", "pay_period_start", "pay_period_end",
        "gross_salary", "net_salary", "status", "payment_date",
    )
    list_select_related = ("employee",)
    list_filter = ("status", "currency", "pay_period_start")
    search_fields = (
        "employee__first_name",
        "employee__last_name",
        "employee__employee_number",
        "reference_number",
    )
    date_hierarchy = "pay_period_start"
    autocomplete_fields = ("employee",)
    raw_id_fields = ("salary_structure",)
    list_per_page = 50


# ============================================================
# AUDIT LOG (read-only)
# ============================================================

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "model_name", "object_id", "ip_address")
    list_select_related = ("user",)
    list_filter = ("action", "created_at")
    search_fields = ("model_name", "object_id", "description", "user__username")
    date_hierarchy = "created_at"
    readonly_fields = (
        "user", "action", "model_name", "object_id",
        "description", "ip_address", "created_at", "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ============================================================
# SYSTEM SETTINGS
# ============================================================

@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "description", "updated_at")
    search_fields = ("key", "description")