
import csv

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from core.models import AuditLog, Department, Employee

from core.utils import (
    BadParam,
    StandardPagination,
    csv_safe,
    log_action,
    parse_bool_param,
)

from departments.serializers import (
    NON_TERMINATED,
    DepartmentDetailSerializer,
    DepartmentEmployeeSerializer,
    DepartmentSerializer,
)

# =====================================================
# HELPERS
# =====================================================

def bad_request(message):
    return Response(
        {"error": message},
        status=status.HTTP_400_BAD_REQUEST
    )


def conflict(message):
    return Response(
        {"error": message},
        status=status.HTTP_409_CONFLICT
    )


def departments_with_counts():
    """
    Department queryset with employee headcount calculated in SQL.
    Terminated employees are excluded from the headcount.
    """
    return Department.objects.annotate(
        employee_count=Count(
            "employees",
            filter=Q(
                employees__employment_status__in=NON_TERMINATED
            ),
            distinct=True,
        )
    )


DEPARTMENT_ORDERING = {
    "name", "-name",
    "code", "-code",
    "created_at", "-created_at",
    "employee_count", "-employee_count",
}


def apply_ordering(queryset, params, allowed, default):
    ordering = params.get("ordering")

    if not ordering:
        return queryset.order_by(*default)

    if ordering not in allowed:
        raise BadParam(
            f"'ordering' must be one of: {', '.join(sorted(allowed))}."
        )

    return queryset.order_by(ordering, "pk")


def filtered_departments(params):
    """
    Department filters:
    - search
    - is_active
    - ordering
    """

    queryset = departments_with_counts()

    search = (params.get("search") or "").strip()

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(code__icontains=search)
            | Q(description__icontains=search)
        )

    is_active = parse_bool_param(params, "is_active")

    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)

    return apply_ordering(
        queryset,
        params,
        DEPARTMENT_ORDERING,
        ("name", "pk"),
    )


def changed_fields(serializer):
    return ", ".join(
        sorted(serializer.validated_data)
    ) or "none"

# =====================================================
# DEPARTMENT: LIST + CREATE
# CSV EXPORT: ?export=csv
# =====================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def department_list_create(request):

    # -----------------------------------------
    # GET: LIST DEPARTMENTS
    # -----------------------------------------

    if request.method == "GET":

        try:
            queryset = filtered_departments(
                request.query_params
            )
        except BadParam as exc:
            return bad_request(str(exc))

        # CSV EXPORT
        if request.query_params.get("export") == "csv":

            response = HttpResponse(
                content_type="text/csv"
            )

            response["Content-Disposition"] = (
                'attachment; filename="departments.csv"'
            )

            writer = csv.writer(response)

            writer.writerow([
                "Name",
                "Code",
                "Description",
                "Active",
                "Employees",
                "Created",
            ])

            for department in queryset.iterator():

                writer.writerow([
                    csv_safe(department.name),
                    csv_safe(department.code),
                    csv_safe(department.description),
                    "Yes" if department.is_active else "No",
                    department.employee_count,
                    department.created_at.date().isoformat(),
                ])

            log_action(
                request,
                AuditLog.Action.EXPORT,
                "Department",
                description="Departments exported to CSV",
            )

            return response

        # PAGINATION
        paginator = StandardPagination()

        page = paginator.paginate_queryset(
            queryset,
            request
        )

        serializer = DepartmentSerializer(
            page,
            many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    # -----------------------------------------
    # POST: CREATE DEPARTMENT
    # -----------------------------------------

    serializer = DepartmentSerializer(
        data=request.data
    )

    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            department = serializer.save()

    except IntegrityError:
        return conflict(
            "A department with this name or code already exists."
        )

    log_action(
        request,
        AuditLog.Action.CREATE,
        "Department",
        object_id=department.pk,
        description=(
            f"Department '{department.name}' "
            f"({department.code}) created"
        ),
    )

    department = departments_with_counts().get(
        pk=department.pk
    )

    return Response(
        DepartmentSerializer(department).data,
        status=status.HTTP_201_CREATED,
    )

# =====================================================
# DEPARTMENT: RETRIEVE + UPDATE + DELETE
# =====================================================

@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def department_detail(request, pk):

    # -----------------------------------------
    # GET: RETRIEVE DEPARTMENT
    # -----------------------------------------

    if request.method == "GET":

        department = get_object_or_404(
            departments_with_counts(),
            pk=pk,
        )

        return Response(
            DepartmentDetailSerializer(
                department
            ).data
        )

    department = get_object_or_404(
        Department,
        pk=pk
    )

    # -----------------------------------------
    # DELETE: DELETE DEPARTMENT
    # -----------------------------------------

    if request.method == "DELETE":

        employees = Employee.objects.filter(
            department=department
        ).count()

        if employees:
            return conflict(
                f"Cannot delete: this department has "
                f"{employees} employee record(s). "
                "Deactivate it instead."
            )

        name = department.name
        code = department.code
        department_id = department.pk

        try:
            with transaction.atomic():
                department.delete()

        except ProtectedError:
            return conflict(
                "Cannot delete: this department is referenced "
                "by other records."
            )

        log_action(
            request,
            AuditLog.Action.DELETE,
            "Department",
            object_id=department_id,
            description=(
                f"Department '{name}' ({code}) deleted"
            ),
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # -----------------------------------------
    # PUT / PATCH: UPDATE DEPARTMENT
    # -----------------------------------------

    serializer = DepartmentSerializer(
        department,
        data=request.data,
        partial=(request.method == "PATCH"),
    )

    serializer.is_valid(
        raise_exception=True
    )

    try:
        with transaction.atomic():
            department = serializer.save()

    except IntegrityError:
        return conflict(
            "A department with this name or code already exists."
        )

    log_action(
        request,
        AuditLog.Action.UPDATE,
        "Department",
        object_id=department.pk,
        description=(
            f"Department '{department.name}' updated "
            f"(fields: {changed_fields(serializer)})"
        ),
    )

    department = departments_with_counts().get(
        pk=department.pk
    )

    return Response(
        DepartmentSerializer(department).data
    )

# =====================================================
# DEPARTMENT: EMPLOYEES
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def department_employees(request, pk):
    """
    Filters:
    ?status=ACTIVE|INACTIVE|ON_LEAVE|TERMINATED
    ?search=
    
    Terminated employees are hidden unless explicitly requested.
    """

    department = get_object_or_404(
        Department,
        pk=pk
    )

    params = request.query_params

    queryset = Employee.objects.filter(
        department=department
    ).select_related(
        "department",
        "manager",
    )

    # STATUS FILTER
    status_value = (
        params.get("status") or ""
    ).upper()

    if status_value:

        if status_value not in Employee.EmploymentStatus.values:
            return bad_request(
                f"'status' must be one of: "
                f"{', '.join(Employee.EmploymentStatus.values)}."
            )

        queryset = queryset.filter(
            employment_status=status_value
        )

    else:
        queryset = queryset.exclude(
            employment_status=Employee.EmploymentStatus.TERMINATED
        )

    # SEARCH FILTER
    search = (
        params.get("search") or ""
    ).strip()

    if search:

        queryset = queryset.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(employee_number__icontains=search)
            | Q(email__icontains=search)
        )

    queryset = queryset.order_by(
        "first_name",
        "last_name",
        "pk",
    )

    paginator = StandardPagination()

    page = paginator.paginate_queryset(
        queryset,
        request
    )

    serializer = DepartmentEmployeeSerializer(
        page,
        many=True
    )

    return paginator.get_paginated_response(
        serializer.data
    )

# =====================================================
# DEPARTMENT: STATISTICS
# =====================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def department_stats(request):

    Status = Employee.EmploymentStatus

    departments = list(
        Department.objects.annotate(
            active_staff=Count(
                "employees",
                filter=Q(
                    employees__employment_status=Status.ACTIVE
                ),
                distinct=True,
            ),

            on_leave_staff=Count(
                "employees",
                filter=Q(
                    employees__employment_status=Status.ON_LEAVE
                ),
                distinct=True,
            ),

            inactive_staff=Count(
                "employees",
                filter=Q(
                    employees__employment_status=Status.INACTIVE
                ),
                distinct=True,
            ),
        ).order_by("name")
    )

    rows = []

    for department in departments:

        headcount = (
            department.active_staff
            + department.on_leave_staff
            + department.inactive_staff
        )

        rows.append({
            "id": str(department.id),
            "name": department.name,
            "code": department.code,
            "is_active": department.is_active,
            "headcount": headcount,
            "active": department.active_staff,
            "on_leave": department.on_leave_staff,
            "inactive": department.inactive_staff,
        })

    total_headcount = sum(
        row["headcount"] for row in rows
    )

    active_departments = [
        row for row in rows if row["is_active"]
    ]

    rows.sort(
        key=lambda row: (
            -row["headcount"],
            row["name"],
        )
    )

    return Response({

        "total_departments": len(rows),

        "active_departments": len(active_departments),

        "inactive_departments": (
            len(rows) - len(active_departments)
        ),

        "empty_departments": sum(
            1 for row in active_departments
            if row["headcount"] == 0
        ),

        "total_headcount": total_headcount,

        "average_headcount": (
            round(
                total_headcount / len(active_departments),
                2,
            )
            if active_departments else 0
        ),

        "largest_department": (
            rows[0]["name"]
            if rows and rows[0]["headcount"] > 0
            else None
        ),

        "departments": rows,
    })
