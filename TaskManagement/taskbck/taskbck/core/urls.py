from django.urls import path

from core.views import (
    dashboard,
    register,
    login,
    logout,
)

urlpatterns = [
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('dashboard/', dashboard, name='dashboard'),
]