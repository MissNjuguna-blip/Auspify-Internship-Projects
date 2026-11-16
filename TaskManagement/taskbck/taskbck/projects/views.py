
from django.db import transaction
from django.db.models import Q, Count, Prefetch
from django.shortcuts import get_object_or_404

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

from projects.permissions import (
    can_access_project,
    can_manage_project,
)

from projects.serializers import ProjectSerializer


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def get_accessible_projects(user):
    """
    Return projects accessible to the authenticated user.
    """

    if not user or not user.is_authenticated:
        return Project.objects.none()

    if user.is_superuser:
        return Project.objects.all()

    return Project.objects.filter(
        created_by=user
    )


def get_project_or_404(user, project_id):
    """
    Retrieve a project accessible to the user
    with task statistics.
    """

    project = get_object_or_404(
        get_project_queryset(user).select_related('created_by'),
        pk=project_id
    )

    return project
def create_project_audit_log(
    user,
    action,
    model_name,
    object_id,
    description
):
    """
    Create an audit log entry.
    """

    return AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        description=description
    )



def get_project_queryset(user):
    """
    Return optimized projects with task statistics.
    """

    return (
        get_accessible_projects(user)
        .select_related('created_by')
        .annotate(
            annotated_total_tasks=Count(
                'tasks',
                distinct=True
            ),
            annotated_completed_tasks=Count(
                'tasks',
                filter=Q(
                    tasks__status=TaskStatusChoices.COMPLETED
                ),
                distinct=True
            ),
            annotated_pending_tasks=Count(
                'tasks',
                filter=Q(
                    tasks__status=TaskStatusChoices.TODO
                ),
                distinct=True
            )
        )
        .order_by('-created_at')
    )
# ==========================================
# LIST PROJECTS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def project_list(request):
    """
    List all projects accessible to the user.

    Supports:
    - Search
    - Status filtering
    """

    projects = get_project_queryset(request.user)

    project_status = request.query_params.get('status')
    search = request.query_params.get('search')

    if project_status:
        projects = projects.filter(
            status=project_status
        )

    if search:
        projects = projects.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search)
        )

    total_count = projects.count()

    serializer = ProjectSerializer(
        projects,
        many=True
    )

    return Response({
        'count': total_count,
        'results': serializer.data
    }, status=status.HTTP_200_OK)


# ==========================================
# CREATE PROJECT
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def project_create(request):
    """
    Create a project for the authenticated user.
    """

    serializer = ProjectSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():

        project = serializer.save(
            created_by=request.user
        )

        create_project_audit_log(
            user=request.user,
            action=AuditLog.Action.CREATE,
            model_name='Project',
            object_id=project.id,
            description=f'Created project: {project.name}'
        )

    return Response({
        'message': 'Project created successfully.',
        'project': ProjectSerializer(project).data
    }, status=status.HTTP_201_CREATED)


# ==========================================
# PROJECT DETAILS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def project_detail(request, project_id):
    """
    Retrieve a single project.
    """

    project = get_project_or_404(
        request.user,
        project_id
    )

    if not can_access_project(request.user, project):
        return Response({
            'error': 'You cannot access this project.'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = ProjectSerializer(project)

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


# ==========================================
# UPDATE PROJECT
# ==========================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def project_update(request, project_id):
    """
    Update an existing project.
    """

    project = get_project_or_404(
        request.user,
        project_id
    )

    if not can_manage_project(request.user, project):
        return Response({
            'error': 'You cannot update this project.'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = ProjectSerializer(
        project,
        data=request.data,
        partial=request.method == 'PATCH'
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():

        updated_project = serializer.save()

        create_project_audit_log(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            model_name='Project',
            object_id=updated_project.id,
            description=f'Updated project: {updated_project.name}'
        )

    return Response({
        'message': 'Project updated successfully.',
        'project': ProjectSerializer(updated_project).data
    }, status=status.HTTP_200_OK)


# ==========================================
# DELETE PROJECT
# ==========================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def project_delete(request, project_id):
    """
    Delete a project and its associated tasks.
    """

    project = get_project_or_404(
        request.user,
        project_id
    )

    if not can_manage_project(request.user, project):
        return Response({
            'error': 'You cannot delete this project.'
        }, status=status.HTTP_403_FORBIDDEN)

    project_name = project.name
    project_id = str(project.id)

    with transaction.atomic():

        create_project_audit_log(
            user=request.user,
            action=AuditLog.Action.DELETE,
            model_name='Project',
            object_id=project_id,
            description=f'Deleted project: {project_name}'
        )

        project.delete()

    return Response({
        'message': 'Project deleted successfully.'
    }, status=status.HTTP_200_OK)
