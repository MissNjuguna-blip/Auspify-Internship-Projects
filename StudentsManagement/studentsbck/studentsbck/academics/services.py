
from django.db import transaction
from django.core.exceptions import ValidationError

from core.models import AcademicYear


# ============================================================
# ACADEMIC YEAR SERVICES
# ============================================================

@transaction.atomic
def activate_academic_year(academic_year):
    """
    Activate an academic year and deactivate all others.
    """

    academic_year = AcademicYear.objects.select_for_update().get(
        pk=academic_year.pk
    )

    if academic_year.start_date >= academic_year.end_date:
        raise ValidationError(
            "Invalid academic year dates."
        )

    AcademicYear.objects.exclude(
        pk=academic_year.pk
    ).filter(
        is_active=True
    ).update(
        is_active=False
    )

    academic_year.is_active = True
    academic_year.save(update_fields=["is_active", "updated_at"])

    return academic_year
