
from core.models import Announcement


def get_all_announcements():
    return Announcement.objects.select_related(
        "created_by"
    ).order_by("-created_at")


def get_published_announcements():
    return Announcement.objects.filter(
        published=True
    ).select_related(
        "created_by"
    ).order_by("-created_at")


def get_unpublished_announcements():
    return Announcement.objects.filter(
        published=False
    ).select_related(
        "created_by"
    ).order_by("-created_at")


def get_announcement_by_id(announcement_id):
    return Announcement.objects.filter(
        id=announcement_id
    ).select_related(
        "created_by"
    ).first()


def get_announcements_by_publisher(user):
    return Announcement.objects.filter(
        created_by=user
    ).order_by("-created_at")


def search_announcements(query):
    return Announcement.objects.filter(
        published=True
    ).filter(
        title__icontains=query
    ).order_by("-created_at")
