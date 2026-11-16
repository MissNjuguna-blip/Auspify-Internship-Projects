
def calculate_grade(marks):

    if marks >= 80:
        return "A"

    elif marks >= 70:
        return "B"

    elif marks >= 60:
        return "C"

    elif marks >= 50:
        return "D"

    elif marks >= 40:
        return "E"

    return "F"


from django.db.models import Sum, Avg, Count

from core.models import StudentResult


def calculate_student_performance(student, examination):

    results = StudentResult.objects.filter(
        student=student,
        examination=examination,
    )

    summary = results.aggregate(
        total_marks=Sum("marks"),
        average_marks=Avg("marks"),
        subjects=Count("id"),
    )

    average = summary["average_marks"] or 0

    summary["grade"] = calculate_grade(average)

    return summary

from django.db.models import Avg, Max, Min, Count


def calculate_subject_performance(examination, subject):

    results = StudentResult.objects.filter(
        examination=examination,
        subject=subject,
    )

    return results.aggregate(
        total_students=Count("id"),
        average=Avg("marks"),
        highest=Max("marks"),
        lowest=Min("marks"),
    )

from django.db.models import Sum


def calculate_examination_positions(examination):

    student_totals = (
        StudentResult.objects
        .filter(examination=examination)
        .values(
            "student_id",
            "student__first_name",
            "student__last_name",
            "student__admission_number",
        )
        .annotate(
            total_marks=Sum("marks")
        )
        .order_by("-total_marks")
    )

    rankings = []

    previous_total = None
    position = 0

    for index, result in enumerate(student_totals, start=1):

        if result["total_marks"] != previous_total:
            position = index

        previous_total = result["total_marks"]

        rankings.append({
            **result,
            "position": position,
        })

    return rankings
