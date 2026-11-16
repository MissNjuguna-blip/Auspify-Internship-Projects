from django.urls import path
from . import views
urlpatterns = [

    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),

    # Personal profile
    path('me/', views.me, name='me'),
    path(
        'profile/update/',
        views.update_profile,
        name='update_profile'
    ),

    # Account security
    path(
        'change-password/',
        views.change_password,
        name='change_password'
    ),

    path(
        'deactivate/',
        views.deactivate_account,
        name='deactivate_account'
    ),

]
