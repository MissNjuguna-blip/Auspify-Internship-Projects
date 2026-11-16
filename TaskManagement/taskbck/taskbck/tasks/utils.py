from core.models import (
    Notification,
    NotificationTypeChoices,
)
from django.db import transaction
# =====================================================
# SECTION 1: NOTIFICATION CREATION
# =====================================================

def create_task_notification(
    task,
    notification_type,
    title,
    message
):

    return Notification.objects.create(
        recipient=task.project.created_by,
        notification_type=notification_type,
        title=title,
        message=message,
        task=task
    )
# =====================================================
# SECTION 2: TASK CREATED NOTIFICATION
# =====================================================

def notify_task_created(task):

    return create_task_notification(
        task=task,
        notification_type=NotificationTypeChoices.TASK_CREATED,
        title='Task Created',
        message=f'You created a new task: {task.title}.'
    )


# =====================================================
# SECTION 3: TASK UPDATED NOTIFICATION
# =====================================================

def notify_task_updated(task):

    return create_task_notification(
        task=task,
        notification_type=NotificationTypeChoices.TASK_UPDATED,
        title='Task Updated',
        message=f'Your task "{task.title}" has been updated.'
    )


# =====================================================
# SECTION 4: TASK COMPLETED NOTIFICATION
# =====================================================

def notify_task_completed(task):

    return create_task_notification(
        task=task,
        notification_type=NotificationTypeChoices.TASK_COMPLETED,
        title='Task Completed',
        message=f'You completed the task: {task.title}.'
    )


# =====================================================
# SECTION 5: TASK COMMENT NOTIFICATION
# =====================================================

def notify_task_commented(task):

    return create_task_notification(
        task=task,
        notification_type=NotificationTypeChoices.TASK_COMMENTED,
        title='New Task Comment',
        message=f'A comment was added to your task: {task.title}.'
    )


# =====================================================
# SECTION 6: TASK OVERDUE NOTIFICATION
# =====================================================

def notify_task_overdue(task):

    return create_task_notification(
        task=task,
        notification_type=NotificationTypeChoices.TASK_OVERDUE,
        title='Task Overdue',
        message=f'Your task "{task.title}" is overdue.'
    )


# =====================================================
# SECTION 7: DEADLINE REMINDER
# =====================================================

def notify_deadline_reminder(task):

    return create_task_notification(
        task=task,
        notification_type=NotificationTypeChoices.DEADLINE_REMINDER,
        title='Task Deadline Reminder',
        message=f'Reminder: "{task.title}" is approaching its deadline.'
    )
