from rest_framework.routers import DefaultRouter
from inventory.views import (
    BookCopyViewSet,
    ShelfViewSet,
    BookLookupViewSet,
)

router = DefaultRouter()
router.register("copies", BookCopyViewSet, basename="inventory-copy")
router.register("shelves", ShelfViewSet, basename="inventory-shelf")
router.register("books", BookLookupViewSet, basename="inventory-book")

urlpatterns = router.urls
