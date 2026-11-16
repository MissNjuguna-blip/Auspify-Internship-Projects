from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "core"

urlpatterns = [
    # Authentication
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login, name="login"),
    path("auth/logout/", views.logout, name="logout"),
    path(
        "auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    # Dashboard
    path("dashboard/", views.admin_dashboard, name="admin_dashboard"),
]