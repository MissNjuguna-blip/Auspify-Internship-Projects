from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from accounts.views import (
    RegisterView,
    MyProfileView,
    ChangePasswordView,
    LogoutView,
    AdminUserViewSet,
)

router = DefaultRouter()
router.register(
    "users",
    AdminUserViewSet,
    basename="account-user",
)

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # Current user's account
    path("me/", MyProfileView.as_view(), name="my-profile"),
    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),

    # Staff account management
    path("", include(router.urls)),
]
