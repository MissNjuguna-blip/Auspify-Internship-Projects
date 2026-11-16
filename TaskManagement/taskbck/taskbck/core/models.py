
import uuid

from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Q


# =====================================================
# COMMON ABSTRACT MODEL
# =====================================================

class BaseModel(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

# =====================================================
# CHOICES
# =====================================================

class StatusChoices(models.TextChoices):
    ACTIVE = 'active', _('Active')
    INACTIVE = 'inactive', _('Inactive')
    ARCHIVED = 'archived', _('Archived')


class PriorityChoices(models.TextChoices):
    LOW = 'low', _('Low')
    MEDIUM = 'medium', _('Medium')
    HIGH = 'high', _('High')
    URGENT = 'urgent', _('Urgent')


class TaskStatusChoices(models.TextChoices):
    TODO = 'todo', _('To Do')
    IN_PROGRESS = 'in_progress', _('In Progress')
    IN_REVIEW = 'in_review', _('In Review')
    COMPLETED = 'completed', _('Completed')
    CANCELLED = 'cancelled', _('Cancelled')


class NotificationTypeChoices(models.TextChoices):
    TASK_CREATED = 'task_created', _('Task Created')
    TASK_UPDATED = 'task_updated', _('Task Updated')
    TASK_COMPLETED = 'task_completed', _('Task Completed')
    TASK_COMMENTED = 'task_commented', _('Task Commented')
    DEADLINE_REMINDER = 'deadline_reminder', _('Deadline Reminder')
    TASK_OVERDUE = 'task_overdue', _('Task Overdue')
    STATUS_CHANGED = 'status_changed', _('Status Changed')

# =====================================================
# USER MODEL
# =====================================================

class User(AbstractUser, BaseModel):

    email = models.EmailField(unique=True)

    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    profile_picture = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True
    )

    is_email_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

# =====================================================
# PROJECT MODEL
# =====================================================

class Project(BaseModel):

    name = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    start_date = models.DateField(
        null=True,
        blank=True
    )

    end_date = models.DateField(
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE
    )

    class Meta:
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['created_by', 'status']),
        ]

    def clean(self):

        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError({
                    'end_date': 'End date cannot be before start date.'
                })

    @property
    def total_tasks(self):
        return self.tasks.count()

    @property
    def completed_tasks(self):
        return self.tasks.filter(
            status=TaskStatusChoices.COMPLETED
        ).count()

    @property
    def pending_tasks(self):
        return self.tasks.filter(
            status=TaskStatusChoices.TODO
        ).count()

    @property
    def completion_percentage(self):

        total = self.total_tasks

        if total == 0:
            return 0

        return round(
            (self.completed_tasks / total) * 100,
            2
        )

    def __str__(self):
        return self.name

# =====================================================
# TASK MODEL
# =====================================================

class Task(BaseModel):

    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    parent_task = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subtasks'
    )

    title = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    priority = models.CharField(
        max_length=20,
        choices=PriorityChoices.choices,
        default=PriorityChoices.MEDIUM
    )

    status = models.CharField(
        max_length=20,
        choices=TaskStatusChoices.choices,
        default=TaskStatusChoices.TODO
    )

    start_date = models.DateTimeField(
        null=True,
        blank=True
    )

    due_date = models.DateTimeField(
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_tasks'
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['project', 'due_date']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['status', 'due_date']),
        ]

        constraints = [
            models.CheckConstraint(
                check=(
                    Q(start_date__isnull=True) |
                    Q(due_date__isnull=True) |
                    Q(due_date__gte=models.F('start_date'))
                ),
                name='task_due_after_start'
            ),

            models.CheckConstraint(
                check=~Q(parent_task=models.F('id')),
                name='task_cannot_be_own_parent'
            ),
        ]

    def clean(self):

        if self.project_id and self.created_by_id:

            if self.project.created_by_id != self.created_by_id:
                raise ValidationError({
                    'created_by': (
                        'Task creator must own the project.'
                    )
                })

        if self.parent_task_id:

            if self.parent_task.project_id != self.project_id:
                raise ValidationError({
                    'parent_task': (
                        'Parent task must belong to the same project.'
                    )
                })

            if self.parent_task_id == self.pk:
                raise ValidationError({
                    'parent_task': (
                        'A task cannot be its own parent.'
                    )
                })

    def save(self, *args, **kwargs):

        self.clean()

        if self.status == TaskStatusChoices.COMPLETED:

            if not self.completed_at:
                self.completed_at = timezone.now()

        else:
            self.completed_at = None

        super().save(*args, **kwargs)

    @property
    def is_completed(self):
        return self.status == TaskStatusChoices.COMPLETED

    @property
    def is_cancelled(self):
        return self.status == TaskStatusChoices.CANCELLED

    @property
    def is_overdue(self):

        if not self.due_date:
            return False

        if self.status in [
            TaskStatusChoices.COMPLETED,
            TaskStatusChoices.CANCELLED
        ]:
            return False

        return self.due_date < timezone.now()

    @property
    def is_due_today(self):

        if not self.due_date:
            return False

        if self.is_completed or self.is_cancelled:
            return False

        return self.due_date.date() == timezone.localdate()

    @property
    def is_upcoming(self):

        if not self.due_date:
            return False

        if self.is_completed or self.is_cancelled:
            return False

        now = timezone.now()

        return (
            now <= self.due_date <=
            now + timezone.timedelta(days=7)
        )

    @property
    def subtask_count(self):
        return self.subtasks.count()

    @property
    def completed_subtasks(self):
        return self.subtasks.filter(
            status=TaskStatusChoices.COMPLETED
        ).count()

    @property
    def subtask_completion_percentage(self):

        total = self.subtask_count

        if not total:
            return 0

        return round(
            (self.completed_subtasks / total) * 100,
            2
        )

    def __str__(self):
        return self.title

# =====================================================
# TASK COMMENTS
# =====================================================

class TaskComment(BaseModel):

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_comments'
    )

    content = models.TextField()

    class Meta:
        ordering = ['created_at']

    def clean(self):

        if self.task_id and self.user_id:

            if self.task.project.created_by_id != self.user_id:
                raise ValidationError(
                    'Only the task owner can comment.'
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Comment on {self.task}'

# =====================================================
# TASK ATTACHMENTS
# =====================================================

class TaskAttachment(BaseModel):

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments'
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='uploaded_attachments'
    )

    file = models.FileField(
        upload_to='task_attachments/'
    )

    filename = models.CharField(max_length=255)

    def clean(self):

        if self.task_id and self.uploaded_by_id:

            if self.task.project.created_by_id != self.uploaded_by_id:
                raise ValidationError(
                    'Only the task owner can upload attachments.'
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.filename

# =====================================================
# PROJECT LABELS
# =====================================================

class Label(BaseModel):

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='labels'
    )

    name = models.CharField(max_length=100)

    color = models.CharField(
        max_length=7,
        default='#808080'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'name'],
                name='unique_project_label'
            )
        ]

    def clean(self):

        if not self.color.startswith('#') or len(self.color) != 7:
            raise ValidationError({
                'color': 'Enter a valid hexadecimal color.'
            })

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# =====================================================
# TASK LABELS
# =====================================================

class TaskLabel(BaseModel):

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='task_labels'
    )

    label = models.ForeignKey(
        Label,
        on_delete=models.CASCADE,
        related_name='task_labels'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['task', 'label'],
                name='unique_task_label'
            )
        ]

    def clean(self):

        if self.task_id and self.label_id:

            if self.task.project_id != self.label.project_id:
                raise ValidationError(
                    'Task and label must belong to the same project.'
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.task.title} - {self.label.name}'

# =====================================================
# NOTIFICATIONS
# =====================================================

class Notification(BaseModel):

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationTypeChoices.choices
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )

    is_read = models.BooleanField(default=False)

    read_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def clean(self):

        if self.task_id and self.recipient_id:

            if self.task.project.created_by_id != self.recipient_id:
                raise ValidationError(
                    'Notification recipient must own the task.'
                )

    def save(self, *args, **kwargs):

        self.clean()

        if self.is_read and not self.read_at:
            self.read_at = timezone.now()

        elif not self.is_read:
            self.read_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.title} - {self.recipient}'

# =====================================================
# AUDIT LOG
# =====================================================

class AuditLog(BaseModel):

    class Action(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        REGISTER = 'register', 'Register'
        COMPLETE = 'complete', 'Complete'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices
    )

    model_name = models.CharField(max_length=100)

    object_id = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )

    description = models.TextField(blank=True)

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['-created_at']

        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f'{self.action} - {self.model_name}'
