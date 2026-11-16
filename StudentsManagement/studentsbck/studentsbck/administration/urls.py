
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SchoolViewSet, AdminDashboardView


# Initialize router
router = DefaultRouter()

# Register school management endpoints
router.register(
    r'schools',
    SchoolViewSet,
    basename='school'
)


urlpatterns = [

    # SCHOOL MANAGEMENT
    path('', include(router.urls)),

    # ADMIN DASHBOARD
    path(
        'dashboard/',
        AdminDashboardView.as_view(),
        name='admin-dashboard'
    ),

]
