from django.urls import path
from core.views import (
    admin_dashboard,
    register,
    login,
    logout,
)

urlpatterns = [
    # Authentication
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("dashboard/", admin_dashboard, name="dashboard"),
]