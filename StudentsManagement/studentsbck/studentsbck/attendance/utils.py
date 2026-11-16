
from django.db.models import Count, Q

from core.models import StudentAttendance


def calculate_classroom_attendance(records):
    return records.aggregate(
        total=Count("id"),
        present=Count("id", filter=Q(status="present")),
        absent=Count("id", filter=Q(status="absent")),
        late=Count("id", filter=Q(status="late")),
        excused=Count("id", filter=Q(status="excused")),
    )


def calculate_attendance_percentage(summary):
    eligible = summary["total"] - summary["excused"]

    attended = summary["present"] + summary["late"]

    return (
        round((attended / eligible) * 100, 2)
        if eligible else 0
    )
