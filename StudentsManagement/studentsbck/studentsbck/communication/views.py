
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

from communication.serializers import (
    AnnouncementSerializer,
    AnnouncementCreateSerializer,
)

from communication.selectors import (
    get_all_announcements,
    get_published_announcements,
    get_announcement_by_id,
)

from communication.services import (
    create_announcement,
    update_announcement,
    publish_announcement,
    unpublish_announcement,
    delete_announcement,
)

from communication.permissions import (
    CanManageAnnouncements,
    CanViewAnnouncements,
)


class AnnouncementListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [CanManageAnnouncements()]

        return [CanViewAnnouncements()]

    def get(self, request):

        announcements = get_published_announcements()

        serializer = AnnouncementSerializer(
            announcements,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = AnnouncementCreateSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        announcement = create_announcement(
            title=serializer.validated_data["title"],
            message=serializer.validated_data["message"],
            created_by=request.user,
        )

        return Response(
            AnnouncementSerializer(announcement).data,
            status=status.HTTP_201_CREATED,
        )


class AnnouncementDetailView(APIView):

    permission_classes = [CanManageAnnouncements]

    def get_object(self, announcement_id):

        announcement = get_announcement_by_id(
            announcement_id
        )

        if not announcement:
            from rest_framework.exceptions import NotFound
            raise NotFound("Announcement not found.")

        return announcement

    def patch(self, request, announcement_id):

        announcement = self.get_object(announcement_id)

        serializer = AnnouncementCreateSerializer(
            announcement,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        announcement = update_announcement(
            announcement,
            **serializer.validated_data,
        )

        return Response(
            AnnouncementSerializer(announcement).data
        )

    def delete(self, request, announcement_id):

        announcement = self.get_object(announcement_id)

        delete_announcement(announcement)

        return Response(
            {"message": "Announcement deleted successfully."},
            status=status.HTTP_200_OK,
        )


class PublishAnnouncementView(APIView):

    permission_classes = [CanManageAnnouncements]

    def post(self, request, announcement_id):

        announcement = self.get_object(announcement_id)

        announcement = publish_announcement(announcement)

        return Response(
            AnnouncementSerializer(announcement).data
        )

    def get_object(self, announcement_id):
        return AnnouncementListCreateView.get_object(
            self, announcement_id
        )


class UnpublishAnnouncementView(APIView):

    permission_classes = [CanManageAnnouncements]

    def post(self, request, announcement_id):

        announcement = get_announcement_by_id(
            announcement_id
        )

        if not announcement:
            from rest_framework.exceptions import NotFound
            raise NotFound("Announcement not found.")

        announcement = unpublish_announcement(announcement)

        return Response(
            AnnouncementSerializer(announcement).data
        )
