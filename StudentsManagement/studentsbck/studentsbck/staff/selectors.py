
from core.models import Staff


def get_all_staff():
    return Staff.objects.select_related(
        "user"
    ).all().order_by("staff_number")


def get_staff_by_id(staff_id):
    return Staff.objects.select_related(
        "user"
    ).filter(id=staff_id).first()


def get_staff_by_user(user):
    return Staff.objects.select_related(
        "user"
    ).filter(user=user).first()


def get_staff_by_number(staff_number):
    return Staff.objects.select_related(
        "user"
    ).filter(staff_number=staff_number).first()


def get_staff_by_designation(designation):
    return Staff.objects.select_related(
        "user"
    ).filter(
        designation__icontains=designation
    )


def search_staff(query):
    return Staff.objects.select_related(
        "user"
    ).filter(
        user__first_name__icontains=query
    ) | Staff.objects.filter(
        user__last_name__icontains=query
    ) | Staff.objects.filter(
        staff_number__icontains=query
    )


def get_total_staff():
    return Staff.objects.count()


def get_staff_designations():
    return Staff.objects.values_list(
        "designation",
        flat=True
    ).distinct()
