
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.models import AuditLog
from core.utils import log_action

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


# =====================================================
# REGISTER
# =====================================================

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):

    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()

    log_action(
        request,
        AuditLog.Action.REGISTER,
        'User',
        object_id=user.pk,
        description=f'{user.username} registered.',
        user=user
    )

    return Response(
        {
            'message': 'Account created successfully.',
            'user': UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED
    )


# =====================================================
# LOGIN
# =====================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):

    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    identifier = serializer.validated_data['username'].strip()

    password = serializer.validated_data['password']

    user_identifier = identifier

    # Support login using email or username.

    if '@' in identifier:

        existing_user = User.objects.filter(
            email__iexact=identifier
        ).first()

        if existing_user:

            user_identifier = existing_user.username

    user = authenticate(
        request=request,
        username=user_identifier,
        password=password
    )

    if user is None:

        log_action(
            request,
            AuditLog.Action.LOGIN,
            'User',
            description='Failed login attempt.'
        )

        return Response(
            {
                'error': 'Invalid username or password.'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:

        return Response(
            {
                'error': 'Your account has been disabled.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    refresh = RefreshToken.for_user(user)

    log_action(
        request,
        AuditLog.Action.LOGIN,
        'User',
        object_id=user.pk,
        description=f'{user.username} logged in.',
        user=user
    )

    return Response(
        {
            'message': 'Login successful.',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access_token': str(refresh.access_token),
        },
        status=status.HTTP_200_OK
    )


# =====================================================
# LOGOUT
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):

    refresh_token = request.data.get('refresh')

    if not refresh_token:

        return Response(
            {
                'error': 'Refresh token is required.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        token = RefreshToken(refresh_token)

        if str(token['user_id']) != str(request.user.pk):

            return Response(
                {
                    'error': 'Invalid token ownership.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        token.blacklist()

        log_action(
            request,
            AuditLog.Action.LOGOUT,
            'User',
            object_id=request.user.pk,
            description=f'{request.user.username} logged out.',
            user=request.user
        )

        return Response(
            {
                'message': 'Successfully logged out.'
            },
            status=status.HTTP_200_OK
        )

    except TokenError:

        return Response(
            {
                'error': 'Invalid or expired refresh token.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


# =====================================================
# CURRENT USER PROFILE
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):

    serializer = UserSerializer(request.user)

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


# =====================================================
# UPDATE PERSONAL PROFILE
# =====================================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):

    serializer = UpdateProfileSerializer(
        request.user,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save()

    return Response(
        {
            'message': 'Profile updated successfully.',
            'user': UserSerializer(request.user).data,
        },
        status=status.HTTP_200_OK
    )


# =====================================================
# CHANGE PASSWORD
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):

    serializer = ChangePasswordSerializer(
        data=request.data,
        context={
            'request': request
        }
    )

    if not serializer.is_valid():

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save()

    log_action(
        request,
        AuditLog.Action.UPDATE,
        'User',
        object_id=request.user.pk,
        description='User changed their password.',
        user=request.user
    )

    return Response(
        {
            'message': 'Password changed successfully.'
        },
        status=status.HTTP_200_OK
    )


# =====================================================
# DEACTIVATE PERSONAL ACCOUNT
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_account(request):

    user = request.user

    if user.is_superuser:

        return Response(
            {
                'error': 'Superuser accounts cannot be deactivated here.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    user.is_active = False

    user.save(
        update_fields=['is_active']
    )

    log_action(
        request,
        AuditLog.Action.UPDATE,
        'User',
        object_id=user.pk,
        description=f'{user.username} deactivated their account.',
        user=user
    )

    return Response(
        {
            'message': 'Your account has been deactivated.'
        },
        status=status.HTTP_200_OK
    )
