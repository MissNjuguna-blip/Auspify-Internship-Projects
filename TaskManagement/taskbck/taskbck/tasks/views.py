
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import (
    Project,
    Task,
    AuditLog,
    TaskStatusChoices,
)

from tasks.serializers import TaskSerializer

from tasks.permissions import (
    can_access_task,
    can_manage_task,
)

from tasks.utils import (
    notify_task_created,
    notify_task_updated,
    notify_task_completed,
)

# =====================================================
# SECTION 2: PERSONAL ACCESS CONTROL
# =====================================================

def get_accessible_projects(user):

    return Project.objects.filter(
        created_by=user
    )



def get_accessible_tasks(user):

    return Task.objects.filter(
        project__created_by=user
    ).select_related(
        'project',
        'created_by',
        'parent_task'
    ).prefetch_related(
        'task_labels__label',
        'comments',
        'attachments',
        'subtasks',
        'notifications'
    )

def get_task_or_404(user, task_id):

    return get_object_or_404(
        get_accessible_tasks(user),
        pk=task_id
    )

# =====================================================
# SECTION 3: AUDIT LOG HELPER
# =====================================================

def create_task_audit_log(
    user,
    action,
    model_name,
    object_id,
    description,
    request=None
):

    ip_address = None

    if request:
        ip_address = request.META.get('REMOTE_ADDR')

    return AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        description=description,
        ip_address=ip_address
    )

    # =====================================================
# SECTION 4: AUDIT LOG HELPER
# =====================================================

def create_task_audit_log(
    user,
    action,
    model_name,
    object_id,
    description,
    request=None
):

    ip_address = None

    if request:
        ip_address = request.META.get('REMOTE_ADDR')

    return AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        description=description,
        ip_address=ip_address
    )

    # =====================================================
# SECTION 5: LIST PERSONAL TASKS
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_list(request):

    tasks = get_accessible_tasks(request.user)

    project_id = request.query_params.get('project')
    task_status = request.query_params.get('status')
    priority = request.query_params.get('priority')
    search = request.query_params.get('search')
    overdue = request.query_params.get('overdue')
    parent_task = request.query_params.get('parent_task')

    if project_id:
        tasks = tasks.filter(
            project_id=project_id
        )

    if task_status:
        tasks = tasks.filter(
            status=task_status
        )

    if priority:
        tasks = tasks.filter(
            priority=priority
        )

    if search:
        tasks = tasks.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(project__name__icontains=search)
        )

    if overdue == 'true':
        tasks = tasks.filter(
            due_date__lt=timezone.now()
        ).exclude(
            status__in=[
                TaskStatusChoices.COMPLETED,
                TaskStatusChoices.CANCELLED
            ]
        )

    if parent_task == 'none':
        tasks = tasks.filter(
            parent_task__isnull=True
        )

    elif parent_task:
        tasks = tasks.filter(
            parent_task_id=parent_task
        )

    tasks = tasks.order_by('-created_at')

    serializer = TaskSerializer(
        tasks,
        many=True
    )

    return Response({
        'count': tasks.count(),
        'results': serializer.data
    }, status=status.HTTP_200_OK)

# =====================================================
# SECTION 5: CREATE PERSONAL TASK
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def task_create(request):

    project_id = request.data.get('project')

    if not project_id:
        return Response(
            {'error': 'Project ID is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    project = get_object_or_404(
        Project,
        pk=project_id,
        created_by=request.user
    )

    serializer = TaskSerializer(data=request.data)

    serializer.is_valid(raise_exception=True)

    with transaction.atomic():

        task = serializer.save(
            project=project,
            created_by=request.user
        )

        notify_task_created(task)

        create_task_audit_log(
            user=request.user,
            action='create',
            model_name='Task',
            object_id=task.id,
            description=f'Created task: {task.title}',
            request=request
        )

    return Response({
        'message': 'Task created successfully.',
        'task': TaskSerializer(task).data
    }, status=status.HTTP_201_CREATED)

# =====================================================
# SECTION 7: PERSONAL TASK DETAIL
# =====================================================


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):

    task = get_task_or_404(
        request.user,
        task_id
    )

    return Response(
        TaskSerializer(task).data,
        status=status.HTTP_200_OK
    )


# =====================================================
# SECTION 7: UPDATE PERSONAL TASK
# =====================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def task_update(request, task_id):

    task = get_task_or_404(
        request.user,
        task_id
    )

    old_status = task.status

    serializer = TaskSerializer(
        task,
        data=request.data,
        partial=request.method == 'PATCH'
    )

    serializer.is_valid(raise_exception=True)

    new_project = serializer.validated_data.get(
        'project',
        task.project
    )

    if new_project.created_by_id != request.user.pk:

        return Response({
            'error': 'You cannot move this task to another user\'s project.'
        }, status=status.HTTP_403_FORBIDDEN)

    with transaction.atomic():

        updated_task = serializer.save()

        if (
            updated_task.status == TaskStatusChoices.COMPLETED
            and old_status != TaskStatusChoices.COMPLETED
        ):

            action = 'complete'
            notify_task_completed(updated_task)

        elif serializer.validated_data:

            action = 'update'
            notify_task_updated(updated_task)

        else:
            action = 'update'

        create_task_audit_log(
            user=request.user,
            action=action,
            model_name='Task',
            object_id=updated_task.id,
            description=f'Updated task: {updated_task.title}',
            request=request
        )

    return Response({
        'message': 'Task updated successfully.',
        'task': TaskSerializer(updated_task).data
    }, status=status.HTTP_200_OK)

# =====================================================
# SECTION 8: DELETE PERSONAL TASK
# =====================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def task_delete(request, task_id):

    task = get_task_or_404(
        request.user,
        task_id
    )

    task_title = task.title
    task_id_string = str(task.id)

    with transaction.atomic():

        create_task_audit_log(
            user=request.user,
            action='delete',
            model_name='Task',
            object_id=task_id_string,
            description=f'Deleted task: {task_title}',
            request=request
        )

        task.delete()

    return Response({
        'message': 'Task deleted successfully.'
    }, status=status.HTTP_200_OK)
