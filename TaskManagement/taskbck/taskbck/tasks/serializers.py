
from rest_framework import serializers

from core.models import (
    Project,
    Task,
    TaskComment,
    TaskAttachment,
    Label,
    TaskLabel,
)


# =====================================================
# SECTION 1: PROJECT SERIALIZER
# =====================================================

class ProjectSerializer(serializers.ModelSerializer):

    total_tasks = serializers.IntegerField(
        read_only=True
    )

    completed_tasks = serializers.IntegerField(
        read_only=True
    )

    pending_tasks = serializers.IntegerField(
        read_only=True
    )

    completion_percentage = serializers.FloatField(
        read_only=True
    )

    class Meta:
        model = Project

        fields = [
            'id',
            'name',
            'description',
            'start_date',
            'end_date',
            'status',
            'created_by',
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


# =====================================================
# SECTION 2: TASK SERIALIZER
# =====================================================

class TaskSerializer(serializers.ModelSerializer):

    project_name = serializers.CharField(
        source='project.name',
        read_only=True
    )

    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )

    is_completed = serializers.BooleanField(
        read_only=True
    )

    is_cancelled = serializers.BooleanField(
        read_only=True
    )

    is_overdue = serializers.BooleanField(
        read_only=True
    )

    is_due_today = serializers.BooleanField(
        read_only=True
    )

    is_upcoming = serializers.BooleanField(
        read_only=True
    )

    subtask_count = serializers.IntegerField(
        read_only=True
    )

    completed_subtasks = serializers.IntegerField(
        read_only=True
    )

    subtask_completion_percentage = serializers.FloatField(
        read_only=True
    )

    class Meta:
        model = Task

        fields = [
            'id',
            'project',
            'project_name',
            'parent_task',
            'title',
            'description',
            'priority',
            'status',
            'start_date',
            'due_date',
            'created_by',
            'created_by_username',
            'completed_at',

            # Task calculations
            'is_completed',
            'is_cancelled',
            'is_overdue',
            'is_due_today',
            'is_upcoming',

            # Subtask calculations
            'subtask_count',
            'completed_subtasks',
            'subtask_completion_percentage',

            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_by',
            'completed_at',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):

        project = attrs.get(
            'project',
            getattr(self.instance, 'project', None)
        )

        parent_task = attrs.get(
            'parent_task',
            getattr(self.instance, 'parent_task', None)
        )

        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )

        due_date = attrs.get(
            'due_date',
            getattr(self.instance, 'due_date', None)
        )

        # Validate dates
        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError({
                'due_date': 'Due date cannot be before start date.'
            })

        # Validate parent task
        if parent_task:

            if project and parent_task.project_id != project.id:
                raise serializers.ValidationError({
                    'parent_task': (
                        'Parent task must belong to the same project.'
                    )
                })

            if self.instance and parent_task.pk == self.instance.pk:
                raise serializers.ValidationError({
                    'parent_task': 'A task cannot be its own parent.'
                })

            # Prevent circular task hierarchy
            if self.instance:
                ancestor = parent_task

                while ancestor:
                    if ancestor.pk == self.instance.pk:
                        raise serializers.ValidationError({
                            'parent_task': (
                                'A task cannot be placed under its own subtask.'
                            )
                        })

                    ancestor = ancestor.parent_task

        return attrs


# =====================================================
# SECTION 3: TASK COMMENT SERIALIZER
# =====================================================

class TaskCommentSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    class Meta:
        model = TaskComment

        fields = [
            'id',
            'task',
            'user',
            'username',
            'content',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'task',
            'user',
            'username',
            'created_at',
            'updated_at',
        ]

    def validate_content(self, value):

        if not value.strip():
            raise serializers.ValidationError(
                'Comment cannot be empty.'
            )

        return value


# =====================================================
# SECTION 4: TASK ATTACHMENT SERIALIZER
# =====================================================

class TaskAttachmentSerializer(serializers.ModelSerializer):

    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment

        fields = [
            'id',
            'task',
            'uploaded_by',
            'uploaded_by_username',
            'file',
            'file_url',
            'filename',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'task',
            'uploaded_by',
            'uploaded_by_username',
            'filename',
            'created_at',
            'updated_at',
        ]

    def get_file_url(self, obj):

        if not obj.file:
            return None

        request = self.context.get('request')

        if request:
            return request.build_absolute_uri(obj.file.url)

        return obj.file.url


# =====================================================
# SECTION 5: PROJECT LABEL SERIALIZER
# =====================================================

class LabelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Label

        fields = [
            'id',
            'project',
            'name',
            'color',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'project',
            'created_at',
            'updated_at',
        ]

    def validate_name(self, value):

        if not value.strip():
            raise serializers.ValidationError(
                'Label name cannot be empty.'
            )

        return value.strip()

    def validate_color(self, value):

        if (
            len(value) != 7
            or not value.startswith('#')
            or any(
                character not in '0123456789abcdefABCDEF'
                for character in value[1:]
            )
        ):
            raise serializers.ValidationError(
                'Enter a valid hexadecimal color, e.g. #FF5733.'
            )

        return value


# =====================================================
# SECTION 6: TASK LABEL SERIALIZER
# =====================================================

class TaskLabelSerializer(serializers.ModelSerializer):

    label_name = serializers.CharField(
        source='label.name',
        read_only=True
    )

    label_color = serializers.CharField(
        source='label.color',
        read_only=True
    )

    class Meta:
        model = TaskLabel

        fields = [
            'id',
            'task',
            'label',
            'label_name',
            'label_color',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
        ]
