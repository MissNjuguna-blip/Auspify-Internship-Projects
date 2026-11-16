
from rest_framework.routers import DefaultRouter

from academics.views import (
    AcademicYearViewSet,
    TermViewSet,
    ClassRoomViewSet,
    SubjectViewSet,
    EnrollmentViewSet,
)
router = DefaultRouter()
router.register(
    r"academic-years",
    AcademicYearViewSet,
    basename="academic-year"
)

router.register(
    r"terms",
    TermViewSet,
    basename="term"
)

router.register(
    r"classrooms",
    ClassRoomViewSet,
    basename="classes"
)

router.register(
    r"subjects",
    SubjectViewSet,
    basename="subject"
)

router.register(
    r"enrollments",
    EnrollmentViewSet,
    basename="enrollment"
)

app_name = "academics"

urlpatterns = router.urls
