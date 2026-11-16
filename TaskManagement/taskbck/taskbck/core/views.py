from datetime import timedelta

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from django.db import transaction
from django.db.models import Count, Q, F

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.models import (
    Project,
    Task,
    Notification,
    AuditLog,
    TaskStatusChoices,
    PriorityChoices,
)

from core.utils import log_action, user_payload

User = get_user_model()

# =====================================================
# USER REGISTRATION
# =====================================================

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):
    """
    Register a new personal task management user.
    """

    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    phone_number = request.data.get('phone_number', '').strip()

    if not username or not email or not password:
        return Response(
            {'error': 'Username, email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {'error': 'Username already taken.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {'error': 'Email already registered.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        validate_password(password)
    except ValidationError as exc:
        return Response(
            {'error': ' '.join(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        is_staff=False,
        is_superuser=False,
    )

    log_action(
        request,
        AuditLog.Action.REGISTER,
        'User',
        object_id=user.pk,
        description=f'User {user.username} registered.',
        user=user
    )

    return Response(
        {
            'message': 'Account created successfully.',
            'user': user_payload(user)
        },
        status=status.HTTP_201_CREATED
    )

# =====================================================
# USER LOGIN
# =====================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate using username or email.
    """

    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_identifier = username

    if '@' in username:
        existing_user = User.objects.filter(
            email__iexact=username
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
            description=f'Failed login attempt: {username[:150]}'
        )

        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'Your account is disabled.'},
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
            'user': user_payload(user),
            'refresh': str(refresh),
            'access_token': str(refresh.access_token),
        },
        status=status.HTTP_200_OK
    )


# =====================================================
# USER LOGOUT
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout and blacklist the supplied refresh token.
    """

    refresh_token = request.data.get('refresh')

    if not refresh_token:
        return Response(
            {'error': 'Refresh token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)

        if str(token['user_id']) != str(request.user.pk):
            return Response(
                {
                    'error': 'This token does not belong to this user.'
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
            {'message': 'Successfully logged out.'},
            status=status.HTTP_200_OK
        )

    except TokenError:
        return Response(
            {'error': 'Invalid or expired refresh token.'},
            status=status.HTTP_400_BAD_REQUEST
        )

# =====================================================
# PERSONAL TASK MANAGEMENT DASHBOARD
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    
    user = request.user

    now = timezone.now()
    today = timezone.localdate()

    next_seven_days = now + timedelta(days=7)

    finished_statuses = [
        TaskStatusChoices.COMPLETED,
        TaskStatusChoices.CANCELLED,
    ]

    # =================================================
    # 1. PERSONAL PROJECTS
    # =================================================

    projects = Project.objects.filter(
        created_by=user
    )

    project_ids = projects.values_list(
        'id',
        flat=True
    )

    # =================================================
    # 2. PERSONAL TASKS
    # =================================================

    tasks = Task.objects.filter(
        project_id__in=project_ids
    )

    active_tasks = tasks.exclude(
        status__in=finished_statuses
    )

    completed_tasks = tasks.filter(
        status=TaskStatusChoices.COMPLETED
    )

    pending_tasks = tasks.filter(
        status=TaskStatusChoices.TODO
    )

    # =================================================
    # 3. PROJECT STATISTICS
    # =================================================

    project_stats = projects.aggregate(

        total=Count('id'),

        active=Count(
            'id',
            filter=Q(status='active')
        ),

        inactive=Count(
            'id',
            filter=Q(status='inactive')
        ),

        archived=Count(
            'id',
            filter=Q(status='archived')
        ),
    )

    # =================================================
    # 4. TASK STATISTICS
    # =================================================

    task_stats = tasks.aggregate(

        total=Count('id'),

        todo=Count(
            'id',
            filter=Q(
                status=TaskStatusChoices.TODO
            )
        ),

        in_progress=Count(
            'id',
            filter=Q(
                status=TaskStatusChoices.IN_PROGRESS
            )
        ),

        in_review=Count(
            'id',
            filter=Q(
                status=TaskStatusChoices.IN_REVIEW
            )
        ),

        completed=Count(
            'id',
            filter=Q(
                status=TaskStatusChoices.COMPLETED
            )
        ),

        cancelled=Count(
            'id',
            filter=Q(
                status=TaskStatusChoices.CANCELLED
            )
        ),

        # Overdue unfinished tasks only
        overdue=Count(
            'id',
            filter=(
                Q(due_date__lt=now)
                & ~Q(status__in=finished_statuses)
                & Q(due_date__isnull=False)
            )
        ),

        # Tasks due today that have not passed
        due_today=Count(
            'id',
            filter=(
                Q(due_date__date=today)
                & Q(due_date__gte=now)
                & ~Q(status__in=finished_statuses)
            )
        ),

        # Tasks due within the next seven days,
        # excluding tasks already overdue
        due_soon=Count(
            'id',
            filter=(
                Q(
                    due_date__gt=now,
                    due_date__lte=next_seven_days
                )
                & ~Q(status__in=finished_statuses)
            )
        ),

        # Completed after the original deadline
        completed_late=Count(
            'id',
            filter=(
                Q(status=TaskStatusChoices.COMPLETED)
                & Q(due_date__isnull=False)
                & Q(completed_at__isnull=False)
                & Q(completed_at__gt=F('due_date'))
            )
        ),
    )

    # =================================================
    # 5. TASK PRIORITY BREAKDOWN
    # =================================================

    priority_breakdown = dict(
        tasks.values('priority')
        .annotate(total=Count('id'))
        .values_list('priority', 'total')
    )

    # =================================================
    # 6. PRODUCTIVITY STATISTICS
    # =================================================

    total_tasks = task_stats['total']

    completed_count = task_stats['completed']

    cancelled_count = task_stats['cancelled']

    # Cancelled tasks are excluded from the
    # completion percentage denominator.

    eligible_tasks = total_tasks - cancelled_count

    completion_rate = (
        round(
            (completed_count / eligible_tasks) * 100,
            2
        )
        if eligible_tasks > 0 else 0
    )

    remaining_tasks = (
        total_tasks - completed_count - cancelled_count
    )

    # =================================================
    # 7. RECENTLY CREATED TASKS
    # =================================================

    recent_tasks = tasks.select_related(
        'project',
        'created_by'
    ).order_by(
        '-created_at'
    )[:10]

    recent_tasks_data = [

        {
            'id': str(task.id),

            'title': task.title,

            'description': task.description,

            'project': task.project.name,

            'priority': task.priority,

            'status': task.status,

            'due_date': (
                task.due_date.isoformat()
                if task.due_date else None
            ),

            'created_at': task.created_at.isoformat(),

            'updated_at': task.updated_at.isoformat(),

        }

        for task in recent_tasks
    ]

    # =================================================
    # 8. PENDING TASKS
    # =================================================

    pending_tasks_list = pending_tasks.select_related(
        'project'
    ).order_by(
        F('due_date').asc(nulls_last=True),
        '-created_at'
    )[:10]

    pending_tasks_data = [

        {
            'id': str(task.id),

            'title': task.title,

            'project': task.project.name,

            'priority': task.priority,

            'status': task.status,

            'due_date': (
                task.due_date.isoformat()
                if task.due_date else None
            ),

            'created_at': task.created_at.isoformat(),

            'is_overdue': (
                task.due_date is not None
                and task.due_date < now
            ),

        }

        for task in pending_tasks_list
    ]

    # =================================================
    # 9. OVERDUE UNFINISHED TASKS
    # =================================================

    overdue_tasks = active_tasks.filter(
        due_date__lt=now
    ).select_related(
        'project'
    ).order_by(
        'due_date'
    )[:10]

    overdue_tasks_data = [

        {
            'id': str(task.id),

            'title': task.title,

            'project': task.project.name,

            'priority': task.priority,

            'status': task.status,

            'due_date': task.due_date.isoformat(),

            'days_overdue': max(
                0,
                (today - timezone.localtime(
                    task.due_date
                ).date()).days
            ),

        }

        for task in overdue_tasks
    ]

    # =================================================
    # 10. COMPLETED TASKS
    # =================================================

    recently_completed = completed_tasks.select_related(
        'project'
    ).order_by(
        F('completed_at').desc(nulls_last=True),
        '-updated_at'
    )[:10]

    completed_tasks_data = [

        {
            'id': str(task.id),

            'title': task.title,

            'project': task.project.name,

            'priority': task.priority,

            'status': task.status,

            'due_date': (
                task.due_date.isoformat()
                if task.due_date else None
            ),

            'completed_at': (
                task.completed_at.isoformat()
                if task.completed_at else None
            ),

            'completed_late': (
                task.due_date is not None
                and task.completed_at is not None
                and task.completed_at > task.due_date
            ),

        }

        for task in recently_completed
    ]

    # =================================================
    # 11. UPCOMING DEADLINES
    # =================================================

    upcoming_tasks = active_tasks.filter(
        due_date__gte=now,
        due_date__lte=next_seven_days
    ).select_related(
        'project'
    ).order_by(
        'due_date'
    )[:10]

    upcoming_tasks_data = [

        {
            'id': str(task.id),

            'title': task.title,

            'project': task.project.name,

            'priority': task.priority,

            'status': task.status,

            'due_date': task.due_date.isoformat(),

        }

        for task in upcoming_tasks
    ]

    # =================================================
    # 12. RECENT PROJECTS
    # =================================================

    recent_projects = projects.order_by(
        '-created_at'
    )[:10]

    recent_projects_data = [

        {
            'id': str(project.id),

            'name': project.name,

            'description': project.description,

            'status': project.status,

            'created_at': project.created_at.isoformat(),

            'start_date': (
                project.start_date.isoformat()
                if project.start_date else None
            ),

            'end_date': (
                project.end_date.isoformat()
                if project.end_date else None
            ),

            'total_tasks': project.tasks.count(),

            'completed_tasks': project.tasks.filter(
                status=TaskStatusChoices.COMPLETED
            ).count(),

        }

        for project in recent_projects
    ]

    # =================================================
    # 13. PERSONAL NOTIFICATIONS
    # =================================================

    notifications = Notification.objects.filter(
        recipient=user
    )

    unread_notifications = notifications.filter(
        is_read=False
    ).count()

    recent_notifications = notifications.order_by(
        '-created_at'
    )[:5]

    notifications_data = [

        {
            'id': str(notification.id),

            'title': notification.title,

            'message': notification.message,

            'notification_type': notification.notification_type,

            'is_read': notification.is_read,

            'created_at': notification.created_at.isoformat(),

            'task_id': (
                str(notification.task_id)
                if notification.task_id else None
            ),

        }

        for notification in recent_notifications
    ]

    # =================================================
    # 14. PERSONAL ACTIVITY
    # =================================================

    recent_activity = AuditLog.objects.filter(
        user=user
    ).order_by(
        '-created_at'
    )[:10]

    recent_activity_data = [

        {
            'id': str(entry.id),

            'action': entry.action,

            'model_name': entry.model_name,

            'object_id': entry.object_id,

            'description': entry.description,

            'created_at': entry.created_at.isoformat(),

        }

        for entry in recent_activity
    ]

    # =================================================
    # 15. DASHBOARD RESPONSE
    # =================================================

    return Response(

        {

            'today': today.isoformat(),

            'user': {

                'id': str(user.id),

                'username': user.username,

                'email': user.email,

                'first_name': user.first_name,

                'last_name': user.last_name,

                'full_name': user.get_full_name(),

            },

            # =========================================
            # SUMMARY
            # =========================================

            'summary': {

                # Projects

                'total_projects': project_stats['total'],

                'active_projects': project_stats['active'],

                'inactive_projects': project_stats['inactive'],

                'archived_projects': project_stats['archived'],

                # Tasks

                'total_tasks': task_stats['total'],

                'pending_tasks': task_stats['todo'],

                'todo_tasks': task_stats['todo'],

                'in_progress_tasks': task_stats['in_progress'],

                'in_review_tasks': task_stats['in_review'],

                'completed_tasks': task_stats['completed'],

                'cancelled_tasks': task_stats['cancelled'],

                'remaining_tasks': remaining_tasks,

                # Deadlines

                'overdue_tasks': task_stats['overdue'],

                'tasks_due_today': task_stats['due_today'],

                'tasks_due_soon': task_stats['due_soon'],

                'completed_late_tasks': task_stats['completed_late'],

                # Productivity

                'completion_rate': completion_rate,

                # Notifications

                'unread_notifications': unread_notifications,

            },

            # =========================================
            # TASK STATUS BREAKDOWN
            # =========================================

            'task_status_breakdown': {

                'todo': task_stats['todo'],

                'in_progress': task_stats['in_progress'],

                'in_review': task_stats['in_review'],

                'completed': task_stats['completed'],

                'cancelled': task_stats['cancelled'],

            },

            # =========================================
            # PRIORITY BREAKDOWN
            # =========================================

            'priority_breakdown': {

                'low': priority_breakdown.get(
                    PriorityChoices.LOW, 0
                ),

                'medium': priority_breakdown.get(
                    PriorityChoices.MEDIUM, 0
                ),

                'high': priority_breakdown.get(
                    PriorityChoices.HIGH, 0
                ),

                'urgent': priority_breakdown.get(
                    PriorityChoices.URGENT, 0
                ),

            },

            # =========================================
            # TASK LISTS
            # =========================================

            'recent_projects': recent_projects_data,

            'recent_tasks': recent_tasks_data,

            'pending_tasks_list': pending_tasks_data,

            'completed_tasks_list': completed_tasks_data,

            'upcoming_deadlines': upcoming_tasks_data,

            'overdue_tasks_list': overdue_tasks_data,

            # =========================================
            # NOTIFICATIONS AND ACTIVITY
            # =========================================

            'recent_notifications': notifications_data,

            'recent_activity': recent_activity_data,

        },
        status=status.HTTP_200_O
    )