
# =====================================================
# PERSONAL TASK PERMISSIONS
# tasks/permissions.py
# =====================================================

def can_access_project(user, project):

    if not user or not user.is_authenticated:
        return False

    return project.created_by_id == user.pk


def can_manage_project(user, project):

    if not user or not user.is_authenticated:
        return False

    return project.created_by_id == user.pk


def can_access_task(user, task):

    if not user or not user.is_authenticated:
        return False

    return task.project.created_by_id == user.pk


def can_manage_task(user, task):

    if not user or not user.is_authenticated:
        return False

    return task.project.created_by_id == user.pk
