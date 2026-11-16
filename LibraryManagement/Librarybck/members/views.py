
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import Member
from members.permissions import IsLibraryStaff
from members.serializer import MemberSerializer
from members.services import (
    register_member,
    renew_membership,
    suspend_membership,
    close_membership,
    refresh_expired_memberships,
)


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsLibraryStaff]

    def get_queryset(self):
        queryset = Member.objects.select_related("user")

        search = self.request.query_params.get("search")
        member_status = self.request.query_params.get("status")
        membership_type = self.request.query_params.get(
            "membership_type"
        )
        expiry = self.request.query_params.get("expiry")

        if search:
            queryset = queryset.filter(
                Q(membership_number__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
            )

        if member_status:
            queryset = queryset.filter(
                status=member_status.upper()
            )

        if membership_type:
            queryset = queryset.filter(
                membership_type=membership_type.upper()
            )

        today = timezone.localdate()

        if expiry == "expired":
            queryset = queryset.filter(
                expiry_date__lt=today
            ).exclude(status=Member.Status.CLOSED)

        elif expiry == "expiring":
            queryset = queryset.filter(
                status=Member.Status.ACTIVE,
                expiry_date__gte=today,
                expiry_date__lte=today + timedelta(days=30),
            )

        elif expiry == "valid":
            queryset = queryset.filter(
                status=Member.Status.ACTIVE
            ).filter(
                Q(expiry_date__isnull=True)
                | Q(expiry_date__gte=today)
            )

        return queryset.distinct()

    def perform_create(self, serializer):
        member = register_member(**serializer.validated_data)
        serializer.instance = member

    @action(detail=True, methods=["post"])
    def renew(self, request, pk=None):
        member = self.get_object()
        raw_expiry_date = request.data.get("expiry_date")

        expiry_date = None

        if raw_expiry_date:
            expiry_date = parse_date(raw_expiry_date)

            if expiry_date is None:
                raise ValidationError({
                    "expiry_date": (
                        "Enter a valid date using YYYY-MM-DD."
                    )
                })

        member = renew_membership(member, expiry_date)

        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        member = suspend_membership(self.get_object())

        return Response(
            self.get_serializer(member).data
        )

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        member = close_membership(self.get_object())

        return Response(
            self.get_serializer(member).data
        )


class MemberStatisticsView(APIView):
    permission_classes = [IsAuthenticated, IsLibraryStaff]

    def get(self, request):
        today = timezone.localdate()
        members = Member.objects.all()

        active = members.filter(
            status=Member.Status.ACTIVE
        ).filter(
            Q(expiry_date__isnull=True)
            | Q(expiry_date__gte=today)
        )

        data = {
            "total_members": members.count(),
            "active_members": active.count(),
            "suspended_members": members.filter(
                status=Member.Status.SUSPENDED
            ).count(),
            "expired_members": members.filter(
                Q(status=Member.Status.EXPIRED)
                | Q(
                    status=Member.Status.ACTIVE,
                    expiry_date__lt=today,
                )
            ).count(),
            "closed_members": members.filter(
                status=Member.Status.CLOSED
            ).count(),
            "students": members.filter(
                membership_type=Member.MembershipType.STUDENT
            ).count(),
            "staff": members.filter(
                membership_type=Member.MembershipType.STAFF
            ).count(),
            "public_members": members.filter(
                membership_type=Member.MembershipType.PUBLIC
            ).count(),
            "researchers": members.filter(
                membership_type=Member.MembershipType.RESEARCHER
            ).count(),
        }

        return Response(data)


class RefreshExpiredMembershipsView(APIView):
    permission_classes = [IsAuthenticated, IsLibraryStaff]

    def post(self, request):
        updated_count = refresh_expired_memberships()

        return Response({
            "message": "Membership expiry statuses refreshed.",
            "updated_count": updated_count,
        })
