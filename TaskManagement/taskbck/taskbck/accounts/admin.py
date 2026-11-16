
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from core.models import User


# =====================================================
# USER ADMIN
# =====================================================

@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'is_active',
        'is_staff',
        'date_joined',
    )

    list_filter = (
        'is_active',
        'is_staff',
        'is_superuser',
        'is_email_verified',
    )

    search_fields = (
        'username',
        'email',
        'first_name',
        'last_name',
    )

    ordering = ('-date_joined',)

    fieldsets = UserAdmin.fieldsets + (
        (
            'Personal Information',
            {
                'fields': (
                    'phone_number',
                    'profile_picture',
                    'is_email_verified',
                )
            }
        ),
    )
