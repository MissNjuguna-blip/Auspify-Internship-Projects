from django.contrib.auth import get_user_model
from django.contrib.auth import update_session_auth_hash
from rest_framework import generics, status, viewsets
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAdminUser,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.serializer import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/accounts/register/

    Register a new library system account.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MyProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/accounts/me/
    PATCH /api/accounts/me/

    Retrieve or update the authenticated user's profile.
    """

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/accounts/change-password/

    Change the authenticated user's password.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        # Preserve an existing Django session if session
        # authentication is also being used.
        update_session_auth_hash(request, user)

        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/accounts/logout/

    Blacklist a refresh token to prevent it from being reused.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "A refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)

            # Ensure the refresh token belongs to the
            # currently authenticated user.
            if str(token["user_id"]) != str(request.user.pk):
                return Response(
                    {"detail": "Invalid refresh token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token.blacklist()

        except (TokenError, KeyError, ValueError):
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Staff-only user management.

    GET     /api/accounts/users/
    POST    /api/accounts/users/
    GET     /api/accounts/users/{id}/
    PUT     /api/accounts/users/{id}/
    PATCH   /api/accounts/users/{id}/
    DELETE  /api/accounts/users/{id}/
    """

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by("username")

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get("search")

        if search:
            from django.db.models import Q

            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        active = self.request.query_params.get("is_active")

        if active in ("true", "false"):
            queryset = queryset.filter(
                is_active=(active == "true")
            )

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create accounts through the registration serializer so
        passwords are always hashed and validated.
        """

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            AdminUserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )
