
from django.urls import path

from .views import (
    AnnouncementListCreateView,
    AnnouncementDetailView,
    PublishAnnouncementView,
    UnpublishAnnouncementView,
)


urlpatterns = [

    path(
        "",
        AnnouncementListCreateView.as_view(),
        name="announcement-list-create",
    ),

    path(
        "<int:announcement_id>/",
        AnnouncementDetailView.as_view(),
        name="announcement-detail",
    ),

    path(
        "<int:announcement_id>/publish/",
        PublishAnnouncementView.as_view(),
        name="announcement-publish",
    ),

    path(
        "<int:announcement_id>/unpublish/",
        UnpublishAnnouncementView.as_view(),
        name="announcement-unpublish",
    ),

]
