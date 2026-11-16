from django.utils import timezone
from rest_framework import serializers

from core.models import Attendance, Employee


# =====================================================
# ATTENDANCE (CRUD)
# =====================================================

class AttendanceSerializer(serializers.ModelSerializer):

    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_number = serializers.CharField(source="employee.employee_number", read_only=True)
    department = serializers.CharField(source="employee.department.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    hours_worked = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_number",
            "department",
            "attendance_date",
            "check_in",
            "check_out",
            "hours_worked",
            "status",
            "status_display",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        # The (employee, attendance_date) uniqueness is checked in validate()
        # so the model's default date and partial updates behave predictably.
        validators = []

    def get_hours_worked(self, obj):
        if obj.check_in and obj.check_out:
            return round((obj.check_out - obj.check_in).total_seconds() / 3600, 2)
        return None

    def validate_attendance_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Attendance cannot be recorded for a future date.")
        return value

    def validate(self, attrs):
        instance = self.instance

        employee = attrs.get("employee", getattr(instance, "employee", None))
        attendance_date = attrs.get(
            "attendance_date",
            getattr(instance, "attendance_date", None) or timezone.localdate(),
        )
        check_in = attrs.get("check_in", getattr(instance, "check_in", None))
        check_out = attrs.get("check_out", getattr(instance, "check_out", None))

        # An existing record cannot be moved to another employee.
        if instance and "employee" in attrs and attrs["employee"].pk != instance.employee_id:
            raise serializers.ValidationError(
                {"employee": "The employee of an attendance record cannot be changed."}
            )

        # New records only for employees who are currently employed.
        if instance is None and employee is not None:
            if employee.employment_status in (
                Employee.EmploymentStatus.TERMINATED,
                Employee.EmploymentStatus.INACTIVE,
            ):
                raise serializers.ValidationError(
                    {"employee": "Attendance cannot be recorded for an inactive or terminated employee."}
                )

        if check_in and check_out and check_out < check_in:
            raise serializers.ValidationError(
                {"check_out": "Check-out cannot be earlier than check-in."}
            )

        # One record per employee per day.
        if employee is not None:
            duplicates = Attendance.objects.filter(
                employee=employee, attendance_date=attendance_date
            )
            if instance:
                duplicates = duplicates.exclude(pk=instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError(
                    "An attendance record already exists for this employee on this date."
                )

        return attrs


# =====================================================
# CHECK-IN / CHECK-OUT
# =====================================================

class CheckInSerializer(serializers.Serializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=500)


class CheckOutSerializer(serializers.Serializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=500)


# =====================================================
# BULK MARKING
# =====================================================

MAX_BULK_RECORDS = 500


class BulkAttendanceItemSerializer(serializers.Serializer):
    # UUIDField (not PrimaryKeyRelatedField) so employees are validated
    # with ONE query for the whole batch instead of one per row.
    employee = serializers.UUIDField()
    status = serializers.ChoiceField(choices=Attendance.AttendanceStatus.choices)
    remarks = serializers.CharField(required=False, allow_blank=True, max_length=500)


class BulkAttendanceSerializer(serializers.Serializer):
    attendance_date = serializers.DateField(required=False)
    records = BulkAttendanceItemSerializer(many=True, allow_empty=False)

    def validate_attendance_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Attendance cannot be recorded for a future date.")
        return value

    def validate_records(self, records):
        if len(records) > MAX_BULK_RECORDS:
            raise serializers.ValidationError(
                f"A maximum of {MAX_BULK_RECORDS} records can be submitted at once."
            )

        ids = [item["employee"] for item in records]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Each employee may appear only once.")
        return records

    def validate(self, attrs):
        ids = [item["employee"] for item in attrs["records"]]

        employees = {e.pk: e for e in Employee.objects.filter(pk__in=ids)}

        missing = [str(i) for i in ids if i not in employees]
        if missing:
            raise serializers.ValidationError(
                {"records": f"Unknown employee id(s): {', '.join(missing[:5])}"}
            )

        blocked = [
            e.employee_number
            for e in employees.values()
            if e.employment_status
            in (Employee.EmploymentStatus.TERMINATED, Employee.EmploymentStatus.INACTIVE)
        ]
        if blocked:
            raise serializers.ValidationError(
                {"records": f"Inactive or terminated employee(s): {', '.join(blocked[:5])}"}
            )

        attrs["employees"] = employees
        return attrs