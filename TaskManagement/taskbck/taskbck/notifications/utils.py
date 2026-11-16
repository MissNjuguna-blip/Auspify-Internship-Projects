from core.models import Notification


def create_notification(
    recipient,
    notification_type,
    title,
    message,
    task=None
):
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        task=task
    )


def notify_task_assigned(task, assigned_user, assigned_by):
    return create_notification(
        recipient=assigned_user,
        notification_type='task_assigned',
        title='New Task Assigned',
        message=(
            f'{assigned_by.username} assigned you '
            f'the task "{task.title}".'
        ),
        task=task
    )


def notify_task_updated(task, recipient):
    return create_notification(
        recipient=recipient,
        notification_type='task_updated',
        title='Task Updated',
        message=f'The task "{task.title}" has been updated.',
        task=task
    )


def notify_task_completed(task, recipient):
    return create_notification(
        recipient=recipient,
        notification_type='task_completed',
        title='Task Completed',
        message=f'The task "{task.title}" has been completed.',
        task=task
    )


def notify_task_commented(task, commenter, recipient):
    return create_notification(
        recipient=recipient,
        notification_type='task_commented',
        title='New Task Comment',
        message=(
            f'{commenter.username} commented on '
            f'"{task.title}".'
        ),
        task=task
    )