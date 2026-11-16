import csv
import logging
from datetime import date

from django.db import IntegrityError, transaction
from django.db.models import Count, Prefetch, Q
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from core.models import (
    AuditLog,
    EmergencyContact,
    Employee,
    EmployeeDocument,
    LeaveRequest,
    SalaryStructure,
)
from core.utils import (
    BadParam,
    StandardPagination,
    csv_safe,
    log_action,
    parse_bool_param,
    parse_uuid_param,
)

from .serializers import (
    MAX_EMERGENCY_CONTACTS,
    EmergencyContactSerializer,
    EmployeeDetailSerializer,
    EmployeeDocumentSerializer,
    EmployeeListSerializer,
    EmployeeWriteSerializer,
    TerminateSerializer,
)

logger = logging.getLogger(__name__)

EmploymentStatus = Employee.EmploymentStatus
NON_TERMINATED = [EmploymentStatus.ACTIVE, EmploymentStatus.ON_LEAVE, EmploymentStatus.INACTIVE]

UPLOAD_PARSERS = [JSONParser, MultiPartParser, FormParser]


# =====================================================
# HELPERS
# =====================================================

def bad_request(message):
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


def conflict(message):
    return Response({"error": message}, status=status.HTTP_409_CONFLICT)


def parse_date_param(params, name):
    raw = params.get(name)
    if not raw:
        return None
    value = parse_date(raw)
    if value is None:
        raise BadParam(f"'{name}' must be a valid date in YYYY-MM-DD format.")
    return value


def changed_fields(serializer):
    return ", ".join(sorted(serializer.validated_data)) or "none"


def delete_stored_files(files):
    """Delete files from storage after the surrounding DB transaction commits."""
    targets = [(f.storage, f.name) for f in files if f and f.name]

    def _delete():
        for storage, name in targets:
            try:
                storage.delete(name)
            except Exception:  # never let a storage hiccup break the request
                logger.warning("Could not delete stored file %s", name, exc_info=True)

    transaction.on_commit(_delete)


def employee_detail_queryset():
    return (
        Employee.objects.select_related("department", "manager")
        .prefetch_related(
            "emergency_contacts",
            Prefetch(
                "documents",
                queryset=EmployeeDocument.objects.select_related("uploaded_by"),
            ),
        )
        .annotate(
            subordinate_count=Count(
                "subordinates",
                filter=Q(subordinates__employment_status__in=NON_TERMINATED),
                distinct=True,
            )
        )
    )


def detail_response(employee_pk, request, http_status=status.HTTP_200_OK, **extra):
    employee = employee_detail_queryset().get(pk=employee_pk)
    data = EmployeeDetailSerializer(employee, context={"request": request}).data
    if extra:
        return Response({**extra, "employee": data}, status=http_status)
    return Response(data, status=http_status)


EMPLOYEE_ORDERING = {
    "first_name", "-first_name", "last_name", "-last_name",
    "employee_number", "-employee_number", "date_joined", "-date_joined",
    "created_at", "-created_at", "department__name", "-department__name",
    "employment_status", "-employment_status",
}


def filtered_employees(params):
    
    queryset = Employee.objects.select_related("department", "manager")

    department_id = parse_uuid_param(params, "department")
    if department_id:
        queryset = queryset.filter(department_id=department_id)

    
    manager_id = parse_uuid_param(params, "manager")
    if manager_id:
        queryset = queryset.filter(manager_id=manager_id)

    status_value = (params.get("status") or "").upper()
    if status_value:
        if status_value not in EmploymentStatus.values:
            raise BadParam(f"'status' must be one of: {', '.join(EmploymentStatus.values)}.")
        queryset = queryset.filter(employment_status=status_value)
    elif parse_bool_param(params, "include_terminated") is not True:
        queryset = queryset.exclude(employment_status=EmploymentStatus.TERMINATED)

    gender = (params.get("gender") or "").upper()
    if gender:
        if gender not in Employee.Gender.values:
            raise BadParam(f"'gender' must be one of: {', '.join(Employee.Gender.values)}.")
        queryset = queryset.filter(gender=gender)

    joined_from = parse_date_param(params, "joined_from")
    joined_to = parse_date_param(params, "joined_to")
    if joined_from:
        queryset = queryset.filter(date_joined__gte=joined_from)
    if joined_to:
        queryset = queryset.filter(date_joined__lte=joined_to)
    if joined_from and joined_to and joined_to < joined_from:
        raise BadParam("'joined_to' cannot be earlier than 'joined_from'.")

    # every word must match at least one field
    for term in (params.get("search") or "").split()[:5]:
        queryset = queryset.filter(
            Q(first_name__icontains=term)
            | Q(middle_name__icontains=term)
            | Q(last_name__icontains=term)
            | Q(employee_number__icontains=term)
            | Q(email__icontains=term)
            | Q(phone_number__icontains=term)
        )

    ordering = params.get("ordering")
    if ordering:
        if ordering not in EMPLOYEE_ORDERING:
            raise BadParam(f"'ordering' must be one of: {', '.join(sorted(EMPLOYEE_ORDERING))}.")
        return queryset.order_by(ordering, "pk")
    return queryset.order_by("first_name", "last_name", "pk")


# =====================================================
# EMPLOYEES: LIST + REGISTER  (CSV with ?export=csv)
# =====================================================

@api_view(["GET", "POST"])
@parser_classes(UPLOAD_PARSERS)
@permission_classes([IsAdminUser])
def employee_list_create(request):

    if request.method == "GET":
        try:
            queryset = filtered_employees(request.query_params)
        except BadParam as exc:
            return bad_request(str(exc))

        if request.query_params.get("export") == "csv":
            response = HttpResponse(content_type="text/csv")
            # response["Content-Disposition"] = 'attachment; filename="employees.csv"'

            writer = csv.writer(response)
            writer.writerow([
                "Employee Number", "Name", "Email", "Phone", "Gender", "Department",
                "Manager", "Status", "Date Joined", "Termination Date",
            ])

            exported = 0
            for e in queryset.iterator():
                writer.writerow([
                    csv_safe(e.employee_number),
                    csv_safe(e.full_name),
                    csv_safe(e.email),
                    csv_safe(e.phone_number),
                    e.gender,
                    csv_safe(e.department.name),
                    csv_safe(e.manager.full_name if e.manager_id else ""),
                    e.employment_status,
                    e.date_joined.isoformat(),
                    e.termination_date.isoformat() if e.termination_date else "",
                ])
                exported += 1

            log_action(
                request,
                AuditLog.Action.EXPORT,
                "Employee",
                description=f"{exported} employee(s) exported to CSV",
            )
            return response

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(
            EmployeeListSerializer(page, many=True, context={"request": request}).data
        )

    # ---------------- register ----------------
    serializer = EmployeeWriteSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            employee = serializer.save()
    except IntegrityError:
        return conflict("An employee with this employee number, email or national ID already exists.")

    log_action(
        request,
        AuditLog.Action.CREATE,
        "Employee",
        object_id=employee.pk,
        description=f"Employee {employee.employee_number} ({employee.full_name}) registered",
    )

    return detail_response(employee.pk, request, status.HTTP_201_CREATED)


# =====================================================
# EMPLOYEE: RETRIEVE + UPDATE + DELETE
# =====================================================

@api_view(["GET", "PUT", "PATCH", "DELETE"])
@parser_classes(UPLOAD_PARSERS)
@permission_classes([IsAdminUser])
def employee_detail(request, pk):

    if request.method == "GET":
        employee = get_object_or_404(employee_detail_queryset(), pk=pk)
        return Response(EmployeeDetailSerializer(employee, context={"request": request}).data)

    employee = get_object_or_404(Employee, pk=pk)

    if request.method == "DELETE":
        # Hard delete is only for records created by mistake. Anyone with
        # history must be terminated so attendance / leave / payroll stay intact.
        history = {
            "attendance records": employee.attendance_records.exists(),
            "leave requests": employee.leave_requests.exists(),
            "leave balances": employee.leave_balances.exists(),
            "salary structures": employee.salary_structures.exists(),
            "payroll records": employee.payroll_records.exists(),
        }
        blocking = [name for name, present in history.items() if present]
        if blocking:
            return conflict(
                f"Cannot delete: this employee has {', '.join(blocking)}. "
                "Terminate the employee instead."
            )

        label = f"{employee.employee_number} ({employee.full_name})"
        employee_id = employee.pk

        with transaction.atomic():
            files = [employee.profile_photo] + [d.file for d in employee.documents.all()]
            employee.delete()
            delete_stored_files(files)

        log_action(
            request,
            AuditLog.Action.DELETE,
            "Employee",
            object_id=employee_id,
            description=f"Employee {label} deleted",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = EmployeeWriteSerializer(
        employee,
        data=request.data,
        partial=(request.method == "PATCH"),
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            employee = serializer.save()
    except IntegrityError:
        return conflict("An employee with this employee number, email or national ID already exists.")

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Employee",
        object_id=employee.pk,
        description=(
            f"Employee {employee.employee_number} updated "
            f"(fields: {changed_fields(serializer)})"
        ),
    )

    return detail_response(employee.pk, request)


# =====================================================
# EMPLOYEE: TERMINATE
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def terminate_employee(request, pk):
    """
    {
      "termination_date": "2026-11-06",
      "new_manager": "<uuid>",     // optional
      "reason": "Resignation"      // optional, kept in the audit log
    }
    Also, in the same transaction:
      - direct reports move to new_manager (or the employee's own manager)
      - pending leave requests are cancelled
      - the active salary structure is closed
    """

    now = timezone.now()

    with transaction.atomic():
        employee = get_object_or_404(Employee.objects.select_for_update(), pk=pk)

        if employee.employment_status == EmploymentStatus.TERMINATED:
            return conflict("This employee is already terminated.")

        serializer = TerminateSerializer(data=request.data, context={"employee": employee})
        serializer.is_valid(raise_exception=True)

        termination_date = serializer.validated_data["termination_date"]
        new_manager = serializer.validated_data.get("new_manager")
        reason = serializer.validated_data.get("reason", "")

        employee.employment_status = EmploymentStatus.TERMINATED
        employee.termination_date = termination_date
        employee.save(update_fields=["employment_status", "termination_date", "updated_at"])

        # Direct reports
        if new_manager is None and employee.manager_id:
            new_manager = (
                Employee.objects.filter(pk=employee.manager_id)
                .exclude(employment_status=EmploymentStatus.TERMINATED)
                .first()
            )
        reassigned = (
            Employee.objects.filter(manager=employee)
            .exclude(employment_status=EmploymentStatus.TERMINATED)
            .update(manager=new_manager, updated_at=now)
        )

        # Pending leave
        cancelled_leave = LeaveRequest.objects.filter(
            employee=employee, status=LeaveRequest.LeaveStatus.PENDING
        ).update(
            status=LeaveRequest.LeaveStatus.CANCELLED,
            review_comment="Cancelled automatically: employee terminated.",
            updated_at=now,
        )

        # Salary
        active_salary = SalaryStructure.objects.filter(employee=employee, is_active=True)
        closed_salary = active_salary.filter(effective_from__lte=termination_date).update(
            is_active=False, effective_to=termination_date, updated_at=now
        )
        closed_salary += active_salary.filter(effective_from__gt=termination_date).update(
            is_active=False, updated_at=now
        )

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Employee",
        object_id=employee.pk,
        description=(
            f"Employee {employee.employee_number} terminated effective {termination_date}"
            + (f" - {reason[:200]}" if reason else "")
            + f" (reports moved: {reassigned}, leave cancelled: {cancelled_leave}, "
            f"salary closed: {closed_salary})"
        ),
    )

    return detail_response(
        employee.pk,
        request,
        message="Employee terminated.",
        subordinates_reassigned=reassigned,
        pending_leave_cancelled=cancelled_leave,
        salary_structures_closed=closed_salary,
    )


# =====================================================
# EMPLOYEE: REACTIVATE
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def reactivate_employee(request, pk):

    with transaction.atomic():
        employee = get_object_or_404(Employee.objects.select_for_update(), pk=pk)

        if employee.employment_status != EmploymentStatus.TERMINATED:
            return conflict("Only terminated employees can be reactivated.")

        if not employee.department.is_active:
            return bad_request("The employee's department is inactive. Reactivate it or reassign first.")
        
        employee.employment_status = EmploymentStatus.ACTIVE
        employee.termination_date = None
        employee.save(update_fields=["employment_status", "termination_date", "updated_at"])

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Employee",
        object_id=employee.pk,
        description=f"Employee {employee.employee_number} reactivated",
    )

    return detail_response(employee.pk, request, message="Employee reactivated.")


# =====================================================
# EMERGENCY CONTACTS
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def contact_list_create(request, pk):

    employee = get_object_or_404(Employee, pk=pk)

    if request.method == "GET":
        contacts = EmergencyContact.objects.filter(employee=employee)
        return Response(EmergencyContactSerializer(contacts, many=True).data)

    serializer = EmergencyContactSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            # lock the employee row so concurrent requests cannot exceed the limit
            Employee.objects.select_for_update().get(pk=employee.pk)

            existing = EmergencyContact.objects.filter(employee=employee).count()
            if existing >= MAX_EMERGENCY_CONTACTS:
                return bad_request(
                    f"An employee can have at most {MAX_EMERGENCY_CONTACTS} emergency contacts."
                )

            # the first contact is always primary; a new primary replaces the old one
            is_primary = bool(serializer.validated_data.get("is_primary")) or existing == 0
            if is_primary:
                EmergencyContact.objects.filter(employee=employee, is_primary=True).update(
                    is_primary=False, updated_at=timezone.now()
                )

            contact = serializer.save(employee=employee, is_primary=is_primary)
    except IntegrityError:
        return conflict("Could not save the contact because of a conflicting update. Please retry.")

    log_action(
        request,
        AuditLog.Action.CREATE,
        "EmergencyContact",
        object_id=contact.pk,
        description=f"Emergency contact added for {employee.employee_number}",
    )

    return Response(EmergencyContactSerializer(contact).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def contact_detail(request, pk, contact_id):

    contact = get_object_or_404(
        EmergencyContact.objects.select_related("employee"),
        pk=contact_id,
        employee_id=pk,
    )
    employee = contact.employee

    if request.method == "GET":
        return Response(EmergencyContactSerializer(contact).data)

    if request.method == "DELETE":
        was_primary = contact.is_primary
        contact_pk = contact.pk

        with transaction.atomic():
            contact.delete()
            if was_primary:
                # promote the oldest remaining contact
                replacement = (
                    EmergencyContact.objects.filter(employee_id=pk).order_by("created_at").first()
                )
                if replacement:
                    replacement.is_primary = True
                    replacement.save(update_fields=["is_primary", "updated_at"])

        log_action(
            request,
            AuditLog.Action.DELETE,
            "EmergencyContact",
            object_id=contact_pk,
            description=f"Emergency contact removed for {employee.employee_number}",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = EmergencyContactSerializer(
        contact, data=request.data, partial=(request.method == "PATCH")
    )
    serializer.is_valid(raise_exception=True)

    wants_primary = serializer.validated_data.get("is_primary")
    if wants_primary is False and contact.is_primary:
        return bad_request("An employee needs a primary contact. Mark another contact as primary instead.")

    try:
        with transaction.atomic():
            if wants_primary:
                EmergencyContact.objects.filter(employee_id=pk, is_primary=True).exclude(
                    pk=contact.pk
                ).update(is_primary=False, updated_at=timezone.now())
            contact = serializer.save()
    except IntegrityError:
        return conflict("Could not save the contact because of a conflicting update. Please retry.")

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "EmergencyContact",
        object_id=contact.pk,
        description=(
            f"Emergency contact updated for {employee.employee_number} "
            f"(fields: {changed_fields(serializer)})"
        ),
    )

    return Response(EmergencyContactSerializer(contact).data)


# =====================================================
# DOCUMENTS
# =====================================================

@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAdminUser])
def document_list_create(request, pk):
    """POST as multipart/form-data: title, document_type, file, description."""

    employee = get_object_or_404(Employee, pk=pk)

    if request.method == "GET":
        documents = EmployeeDocument.objects.filter(employee=employee).select_related("uploaded_by")

        document_type = (request.query_params.get("document_type") or "").upper()
        if document_type:
            if document_type not in EmployeeDocument.DocumentType.values:
                return bad_request(
                    f"'document_type' must be one of: {', '.join(EmployeeDocument.DocumentType.values)}."
                )
            documents = documents.filter(document_type=document_type)

        return Response(
            EmployeeDocumentSerializer(documents, many=True, context={"request": request}).data
        )

    serializer = EmployeeDocumentSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    document = serializer.save(employee=employee, uploaded_by=request.user)

    log_action(
        request,
        AuditLog.Action.CREATE,
        "EmployeeDocument",
        object_id=document.pk,
        description=(
            f"Document '{document.title}' ({document.document_type}) uploaded "
            f"for {employee.employee_number}"
        ),
    )

    return Response(
        EmployeeDocumentSerializer(document, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH", "DELETE"])
@parser_classes(UPLOAD_PARSERS)
@permission_classes([IsAdminUser])
def document_detail(request, pk, document_id):
    """PATCH edits title / type / description only. To replace a file, upload a new one."""

    document = get_object_or_404(
        EmployeeDocument.objects.select_related("employee", "uploaded_by"),
        pk=document_id,
        employee_id=pk,
    )
    employee = document.employee

    if request.method == "GET":
        return Response(EmployeeDocumentSerializer(document, context={"request": request}).data)

    if request.method == "DELETE":
        title, document_pk = document.title, document.pk

        with transaction.atomic():
            file = document.file
            document.delete()
            delete_stored_files([file])

        log_action(
            request,
            AuditLog.Action.DELETE,
            "EmployeeDocument",
            object_id=document_pk,
            description=f"Document '{title}' deleted for {employee.employee_number}",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    if "file" in request.data or request.FILES:
        return bad_request("A document's file cannot be changed. Upload a new document and delete the old one.")

    serializer = EmployeeDocumentSerializer(
        document, data=request.data, partial=True, context={"request": request}
    )
    serializer.is_valid(raise_exception=True)
    document = serializer.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "EmployeeDocument",
        object_id=document.pk,
        description=(
            f"Document '{document.title}' updated for {employee.employee_number} "
            f"(fields: {changed_fields(serializer)})"
        ),
    )

    return Response(EmployeeDocumentSerializer(document, context={"request": request}).data)


# =====================================================
# STATISTICS REPORT
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def employee_stats(request):

    today = timezone.localdate()

    totals = Employee.objects.aggregate(
        total=Count("pk"),
        active=Count("pk", filter=Q(employment_status=EmploymentStatus.ACTIVE)),
        on_leave=Count("pk", filter=Q(employment_status=EmploymentStatus.ON_LEAVE)),
        inactive=Count("pk", filter=Q(employment_status=EmploymentStatus.INACTIVE)),
        terminated=Count("pk", filter=Q(employment_status=EmploymentStatus.TERMINATED)),
    )

    current = Employee.objects.exclude(employment_status=EmploymentStatus.TERMINATED)

    by_gender = list(
        current.values("gender").annotate(total=Count("pk")).order_by("gender")
    )

    by_department = list(
        current.values("department_id", "department__name")
        .annotate(total=Count("pk"))
        .order_by("-total", "department__name")
    )

    
    # last 12 calendar months, oldest first, zero-filled
    months = []
    year, month = today.year, today.month
    for _ in range(12):
        months.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    months.reverse()
    window_start = months[0]

    hires = {
        row["month"]: row["total"]
        for row in Employee.objects.filter(date_joined__gte=window_start)
        .annotate(month=TruncMonth("date_joined"))
        .values("month")
        .annotate(total=Count("pk"))
    }

    exits = {
        row["month"]: row["total"]
        for row in Employee.objects.filter(
            employment_status=EmploymentStatus.TERMINATED,
            termination_date__gte=window_start,
        )
        .annotate(month=TruncMonth("termination_date"))
        .values("month")
        .annotate(total=Count("pk"))
    }

    return Response(
        {
            "summary": {
                "total_employees": totals["total"],
                "active": totals["active"],
                "on_leave": totals["on_leave"],
                "inactive": totals["inactive"],
                "terminated": totals["terminated"],
                "current_headcount": totals["active"] + totals["on_leave"] + totals["inactive"],
                "hires_last_12_months": sum(hires.values()),
                "terminations_last_12_months": sum(exits.values()),
            },
            "by_gender": by_gender,
            "by_department": [
                {
                    "department_id": str(row["department_id"]),
                    "department": row["department__name"],
                    "headcount": row["total"],
                }
                for row in by_department
            ],
            
            "monthly_movement": [
                {
                    "month": m.strftime("%Y-%m"),
                    "hires": hires.get(m, 0),
                    "terminations": exits.get(m, 0),
                }
                for m in months
            ],
        }
    )