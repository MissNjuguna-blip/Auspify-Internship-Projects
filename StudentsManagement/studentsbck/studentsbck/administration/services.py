
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from core.models import (
    School,
    Student,
    Staff,
    AcademicYear,
    Term,
    ClassRoom,
    Subject,
    Enrollment,
    StudentAttendance,
    Examination,
    StudentResult,
    FeeCategory,
    FeePayment,
    Announcement,
)


# ============================================================
# SCHOOL SERVICES
# ============================================================

def get_school_statistics():

    return {
        "total_schools": School.objects.count(),
    }


# ============================================================
# STUDENT STATISTICS
# ============================================================

def get_student_statistics():

    return {
        "total_students": Student.objects.count(),
    }


# ============================================================
# STAFF STATISTICS
# ============================================================

def get_staff_statistics():

    return {
        "total_staff": Staff.objects.count(),
    }


# ============================================================
# ACADEMIC STATISTICS
# ============================================================

def get_academic_statistics():

    return {
        "total_academic_years": AcademicYear.objects.count(),
        "active_academic_years": AcademicYear.objects.filter(
            is_active=True
        ).count(),
        "total_terms": Term.objects.count(),
        "total_classrooms": ClassRoom.objects.count(),
        "total_subjects": Subject.objects.count(),
        "total_enrollments": Enrollment.objects.count(),
        "total_examinations": Examination.objects.count(),
    }


# ============================================================
# ATTENDANCE STATISTICS
# ============================================================

def get_attendance_statistics():

    return {
        "total_attendance_records": StudentAttendance.objects.count(),

        "present": StudentAttendance.objects.filter(
            status="present"
        ).count(),

        "absent": StudentAttendance.objects.filter(
            status="absent"
        ).count(),

        "late": StudentAttendance.objects.filter(
            status="late"
        ).count(),

        "excused": StudentAttendance.objects.filter(
            status="excused"
        ).count(),
    }


# ============================================================
# FINANCIAL STATISTICS
# ============================================================

def get_financial_statistics():

    payment_stats = FeePayment.objects.aggregate(
        total_amount=Sum("amount"),
        total_payments=Count("id"),
    )

    return {
        "total_fee_categories": FeeCategory.objects.count(),

        "total_payments": payment_stats["total_payments"] or 0,

        "total_amount_collected": str(
            payment_stats["total_amount"] or Decimal("0.00")
        ),
    }


# ============================================================
# RECENT STUDENTS
# ============================================================

def get_recent_students():

    students = Student.objects.order_by("-created_at")[:10]

    return [
        {
            "id": student.id,
            "admission_number": student.admission_number,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "other_names": student.other_names,
            "created_at": student.created_at.isoformat(),
        }
        for student in students
    ]


# ============================================================
# RECENT ENROLLMENTS
# ============================================================

def get_recent_enrollments():

    enrollments = Enrollment.objects.select_related(
        "student",
        "classroom",
        "academic_year",
    ).order_by("-enrollment_date")[:10]

    return [
        {
            "id": enrollment.id,
            "student": str(enrollment.student),
            "admission_number": enrollment.student.admission_number,
            "classroom": enrollment.classroom.name,
            "academic_year": enrollment.academic_year.name,
            "enrollment_date": enrollment.enrollment_date.isoformat(),
        }
        for enrollment in enrollments
    ]


# ============================================================
# RECENT ANNOUNCEMENTS
# ============================================================

def get_recent_announcements():

    announcements = Announcement.objects.select_related(
        "created_by"
    ).filter(
        published=True
    ).order_by("-created_at")[:10]

    return [
        {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "created_by": announcement.created_by.username,
            "created_at": announcement.created_at.isoformat(),
        }
        for announcement in announcements
    ]


# ============================================================
# ADMIN DASHBOARD SERVICE
# ============================================================

def get_admin_dashboard():

    today = timezone.localdate()

    return {
        "today": today.isoformat(),

        "schools": get_school_statistics(),

        "students": get_student_statistics(),

        "staff": get_staff_statistics(),

        "academics": get_academic_statistics(),

        "attendance": get_attendance_statistics(),

        "finance": get_financial_statistics(),

        "recent_students": get_recent_students(),

        "recent_enrollments": get_recent_enrollments(),

        "recent_announcements": get_recent_announcements(),
    }
