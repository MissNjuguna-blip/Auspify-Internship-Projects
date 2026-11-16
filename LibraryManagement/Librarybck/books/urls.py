
from rest_framework.routers import DefaultRouter

from books.views import (
    AuthorViewSet,
    PublisherViewSet,
    CategoryViewSet,
    ShelfViewSet,
    BookViewSet,
    BookCopyViewSet,
)

router = DefaultRouter()

router.register("authors", AuthorViewSet, basename="author")
router.register("publishers", PublisherViewSet, basename="publisher")
router.register("categories", CategoryViewSet, basename="category")
router.register("shelves", ShelfViewSet, basename="shelf")
router.register("books", BookViewSet, basename="book")
router.register("book-copies", BookCopyViewSet, basename="book-copy")

urlpatterns = router.urls
