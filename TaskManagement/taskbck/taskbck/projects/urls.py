
from django.urls import path

from projects.views import (
    project_list,
    project_create,
    project_detail,
    project_update,
    project_delete,
)


app_name = 'projects'


urlpatterns = [

    # ======================================
    # PROJECT ENDPOINTS
    # ======================================

    path(
        'list/',
        project_list,
        name='project-list'
    ),

    path(
        'create/',
        project_create,
        name='project-create'
    ),

    path(
        '<uuid:project_id>/',
        project_detail,
        name='project-detail'
    ),

    path(
        '<uuid:project_id>/update/',
        project_update,
        name='project-update'
    ),

    path(
        '<uuid:project_id>/delete/',
        project_delete,
        name='project-delete'
    ),

]
