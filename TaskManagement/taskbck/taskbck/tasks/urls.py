
from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [

    # Task management
    path('list/', views.task_list, name='task-list'),
    path('create/', views.task_create, name='task-create'),
    path('<uuid:task_id>/', views.task_detail, name='task-detail'),
    path('<uuid:task_id>/update/', views.task_update, name='task-update'),
    path('<uuid:task_id>/delete/', views.task_delete, name='task-delete'),

]
