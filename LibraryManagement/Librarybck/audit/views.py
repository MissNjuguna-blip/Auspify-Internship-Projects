
from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.db.models import Count

from rest_framework import generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from core.models import AuditLog
from audit.serializer import AuditLogSerializer
from audit.permissions import IsAuditStaff


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit/logs/

    List and filter audit records.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAuditStaff]

    queryset = AuditLog.objects.select_related("actor").all()

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "entity_type",
        "entity_id",
        "description",
        "actor__username",
        "actor__email",
    ]

    ordering_fields = [
        "created_at",
        "action",
        "entity_type",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        # Filter by action, e.g. CREATE, UPDATE, DELETE.
        action = params.get("action")
        if action:
            valid_actions = AuditLog.Action.values
            if action not in valid_actions:
                raise ValidationError({
                    "action": "Invalid audit action."
                })
            queryset = queryset.filter(action=action)

        # Filter by model/entity type, e.g. Book or Loan.
        entity_type = params.get("entity_type")
        if entity_type:
            queryset = queryset.filter(
                entity_type__iexact=entity_type
            )

        # Filter by the affected record's ID.
        entity_id = params.get("entity_id")
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)

        # Filter by the staff user's database ID.
        actor_id = params.get("actor")
        if actor_id:
            if not actor_id.isdigit():
                raise ValidationError({
                    "actor": "Actor must be a numeric user ID."
                })
            queryset = queryset.filter(actor_id=int(actor_id))

        # Inclusive date filtering using the local timezone.
        date_from = params.get("date_from")
        if date_from:
            parsed_from = parse_date(date_from)
            if parsed_from is None:
                raise ValidationError({
                    "date_from": "Use YYYY-MM-DD format."
                })

            start = timezone.make_aware(
                timezone.datetime.combine(
                    parsed_from,
                    timezone.datetime.min.time(),
                ),
                timezone.get_current_timezone(),
            )
            queryset = queryset.filter(created_at__gte=start)

        date_to = params.get("date_to")
        if date_to:
            parsed_to = parse_date(date_to)
            if parsed_to is None:
                raise ValidationError({
                    "date_to": "Use YYYY-MM-DD format."
                })

            next_day = parsed_to + timedelta(days=1)
            end = timezone.make_aware(
                timezone.datetime.combine(
                    next_day,
                    timezone.datetime.min.time(),
                ),
                timezone.get_current_timezone(),
            )
            queryset = queryset.filter(created_at__lt=end)

        if date_from and date_to and parsed_from > parsed_to:
            raise ValidationError({
                "date_to": "Must be on or after date_from."
            })

        return queryset


class AuditLogDetailView(generics.RetrieveAPIView):
    """
    GET /api/audit/logs/{id}/

    Retrieve a single audit record.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAuditStaff]
    queryset = AuditLog.objects.select_related("actor").all()


class AuditSummaryView(APIView):
    """
    GET /api/audit/summary/

    Return audit activity counts.
    """

    permission_classes = [IsAuthenticated, IsAuditStaff]

    def get(self, request):
        today = timezone.localdate()
        start_of_day = timezone.make_aware(
            timezone.datetime.combine(
                today,
                timezone.datetime.min.time(),
            ),
            timezone.get_current_timezone(),
        )

        queryset = AuditLog.objects.all()

        action_counts = {
            item["action"]: item["total"]
            for item in queryset.values("action").annotate(
                total=Count("id")
            )
        }

        entity_counts = {
            item["entity_type"]: item["total"]
            for item in queryset.values("entity_type").annotate(
                total=Count("id")
            ).order_by("-total")
        }

        return Response({
            "total_logs": queryset.count(),
            "today_logs": queryset.filter(
                created_at__gte=start_of_day
            ).count(),
            "actions": action_counts,
            "entities": entity_counts,
        })
