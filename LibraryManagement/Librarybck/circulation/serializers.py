from rest_framework import serializers
from core.models import BookCopy, Loan, LoanRenewal

class BookCopySummarySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(
        source="book.title",
        read_only=True,
    )
    barcode = serializers.CharField(read_only=True)

    class Meta:
        model = BookCopy
        fields = [
            "id",
            "book",
            "book_title",
            "barcode",
            "status",
            "condition",
            "shelf",
        ]


class LoanRenewalSerializer(serializers.ModelSerializer):
    renewed_by_username = serializers.CharField(
        source="renewed_by.username",
        read_only=True,
    )

    class Meta:
        model = LoanRenewal
        fields = [
            "id",
            "loan",
            "previous_due_date",
            "new_due_date",
            "renewed_by",
            "renewed_by_username",
            "reason",
            "created_at",
        ]
        read_only_fields = fields


class LoanSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    membership_number = serializers.CharField(
        source="member.membership_number",
        read_only=True,
    )
    book_title = serializers.CharField(
        source="book_copy.book.title",
        read_only=True,
    )
    barcode = serializers.CharField(
        source="book_copy.barcode",
        read_only=True,
    )
    issued_by_username = serializers.CharField(
        source="issued_by.username",
        read_only=True,
    )
    returned_to_username = serializers.CharField(
        source="returned_to.username",
        read_only=True,
    )
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    renewals = LoanRenewalSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Loan
        fields = [
            "id",
            "member",
            "member_name",
            "membership_number",
            "book_copy",
            "book_title",
            "barcode",
            "issued_by",
            "issued_by_username",
            "returned_to",
            "returned_to_username",
            "issue_date",
            "due_date",
            "return_date",
            "status",
            "renewal_count",
            "notes",
            "is_overdue",
            "days_overdue",
            "renewals",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_member_name(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}"

    def get_is_overdue(self, obj):
        from django.utils import timezone

        return (
            obj.return_date is None
            and obj.status in [
                Loan.Status.ACTIVE,
                Loan.Status.OVERDUE,
            ]
            and obj.due_date < timezone.localdate()
        )

    def get_days_overdue(self, obj):
        from django.utils import timezone

        if not self.get_is_overdue(obj):
            return 0

        return (timezone.localdate() - obj.due_date).days


class IssueLoanSerializer(serializers.Serializer):
    member = serializers.IntegerField()
    book_copy = serializers.IntegerField()
    due_date = serializers.DateField()
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_due_date(self, value):
        from django.utils import timezone

        if value < timezone.localdate():
            raise serializers.ValidationError(
                "The due date cannot be in the past."
            )
        return value


class ReturnLoanSerializer(serializers.Serializer):
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class RenewLoanSerializer(serializers.Serializer):
    new_due_date = serializers.DateField()
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_new_due_date(self, value):
        from django.utils import timezone

        if value <= timezone.localdate():
            raise serializers.ValidationError(
                "The new due date must be in the future."
            )
        return value
