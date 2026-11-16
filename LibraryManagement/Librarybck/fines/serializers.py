from decimal import Decimal
from rest_framework import serializers
from core.models import Fine, FinePayment, Loan
from fines.services import get_outstanding_balance
from django.utils import timezone

class FineSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="loan.member",
        read_only=True,
    )
    membership_number = serializers.CharField(
        source="loan.member.membership_number",
        read_only=True,
    )
    book_title = serializers.CharField(
        source="loan.book_copy.book.title",
        read_only=True,
    )
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Fine
        fields = [
            "id",
            "loan",
            "member_name",
            "membership_number",
            "book_title",
            "fine_type",
            "amount",
            "amount_paid",
            "balance",
            "status",
            "description",
            "created_at",
        ]
        read_only_fields = fields

    def get_balance(self, obj):
        return get_outstanding_balance(obj)


class FinePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinePayment
        fields = [
            "id",
            "fine",
            "amount",
            "payment_method",
            "transaction_reference",
            "received_by",
            "paid_at",
            "notes",
        ]
        read_only_fields = fields


class PaymentCreateSerializer(serializers.Serializer):
    fine_id = serializers.IntegerField(min_value=1)
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    payment_method = serializers.ChoiceField(
        choices=FinePayment.PaymentMethod.choices,
    )
    transaction_reference = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )


class OverdueLoanSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member",
        read_only=True,
    )
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
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "member_name",
            "membership_number",
            "book_title",
            "barcode",
            "issue_date",
            "due_date",
            "status",
            "days_overdue",
        ]

    def get_days_overdue(self, obj):
        return max(
            (timezone.localdate() - obj.due_date).days,
            0,
        )
