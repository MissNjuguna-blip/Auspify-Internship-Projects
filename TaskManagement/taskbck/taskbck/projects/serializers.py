
from rest_framework import serializers

from core.models import Project


class ProjectSerializer(serializers.ModelSerializer):

    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )

    created_by_email = serializers.EmailField(
        source='created_by.email',
        read_only=True
    )

    # Task statistics from queryset annotations
    total_tasks = serializers.IntegerField(
        source='annotated_total_tasks',
        read_only=True,
        default=0
    )

    completed_tasks = serializers.IntegerField(
        source='annotated_completed_tasks',
        read_only=True,
        default=0
    )

    pending_tasks = serializers.IntegerField(
        source='annotated_pending_tasks',
        read_only=True,
        default=0
    )

    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Project

        fields = [
            'id',
            'name',
            'description',
            'start_date',
            'end_date',
            'created_by',
            'created_by_username',
            'created_by_email',
            'status',
            'total_tasks',
            'completed_tasks',
            'pending_tasks',
            'completion_percentage',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at',
            'total_tasks',
            'completed_tasks',
            'pending_tasks',
            'completion_percentage',
        ]

    def validate(self, attrs):

        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )

        end_date = attrs.get(
            'end_date',
            getattr(self.instance, 'end_date', None)
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })

        return attrs


class ProjectCreateSerializer(ProjectSerializer):
    """
    Dedicated serializer for creating projects.
    """

    class Meta(ProjectSerializer.Meta):
        read_only_fields = ProjectSerializer.Meta.read_only_fields
