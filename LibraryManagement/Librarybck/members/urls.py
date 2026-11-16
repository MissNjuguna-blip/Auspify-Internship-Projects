
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from members.views import (
    MemberViewSet,
    MemberStatisticsView,
    RefreshExpiredMembershipsView,
)

router = DefaultRouter()
router.register("members", MemberViewSet, basename="member")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "statistics/",
        MemberStatisticsView.as_view(),
        name="member-statistics",
    ),
    path(
        "refresh-expired/",
        RefreshExpiredMembershipsView.as_view(),
        name="refresh-expired-memberships",
    ),
]
