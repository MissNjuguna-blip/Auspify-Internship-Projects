from django.db import models
# Create your models here.
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class BaseModel(models.Model):
    """Abstract base class providing common timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

# ============================================================
# ACCOUNTS
# ============================================================

class User(AbstractUser, BaseModel):
    phone_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.username


# ============================================================
# BOOKS
# ============================================================

class Author(BaseModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    biography = models.TextField(blank=True, null=True)
    email = models.EmailField(blank=True,null=True)
    # date_of_birth = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Publisher(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    address = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Category(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Book(BaseModel):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    isbn = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
    )
    authors = models.ManyToManyField(
        Author,
        related_name="books",
    )
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="books",
    )
    categories = models.ManyToManyField(
        Category,
        related_name="books",
    )
    edition = models.CharField(max_length=50, blank=True)
    publication_year = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    language = models.CharField(max_length=50, default="English")
    description = models.TextField(blank=True)
    cover_image = models.ImageField(
        upload_to="book_covers/",
        blank=True,
        null=True,
    )
    page_count = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["title"]
        indexes = [
            models.Index(fields=["title"]),
        ]

    def __str__(self):
        return self.title


# ============================================================
# MEMBERS
# ============================================================

class Member(BaseModel):

    class MembershipType(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        STAFF = "STAFF", "Staff"
        PUBLIC = "PUBLIC", "Public"
        RESEARCHER = "RESEARCHER", "Researcher"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SUSPENDED = "SUSPENDED", "Suspended"
        EXPIRED = "EXPIRED", "Expired"
        CLOSED = "CLOSED", "Closed"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="membership",
    )
    membership_number = models.CharField(
        max_length=30,
        unique=True,
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    membership_type = models.CharField(
        max_length=20,
        choices=MembershipType.choices,
        default=MembershipType.PUBLIC,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    address = models.TextField(blank=True)
    joined_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(
        max_length=150,
        blank=True,
    )
    emergency_contact_phone = models.CharField(
        max_length=20,
        blank=True,
    )

    class Meta:
        ordering = ["last_name", "first_name"]
        indexes = [
            models.Index(fields=["membership_number"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return (
            f"{self.membership_number} - "
            f"{self.first_name} {self.last_name}"
        )


# ============================================================
# INVENTORY
# ============================================================

class Shelf(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class BookCopy(BaseModel):

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        ON_LOAN = "ON_LOAN", "On loan"
        RESERVED = "RESERVED", "Reserved"
        DAMAGED = "DAMAGED", "Damaged"
        LOST = "LOST", "Lost"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    class Condition(models.TextChoices):
        NEW = "NEW", "New"
        GOOD = "GOOD", "Good"
        FAIR = "FAIR", "Fair"
        POOR = "POOR", "Poor"

    book = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        related_name="copies",
    )
    barcode = models.CharField(max_length=100, unique=True)
    shelf = models.ForeignKey(
        Shelf,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="copies",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    condition = models.CharField(
        max_length=10,
        choices=Condition.choices,
        default=Condition.GOOD,
    )
    acquisition_date = models.DateField(null=True, blank=True)
    acquisition_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["barcode"]
        indexes = [
            models.Index(fields=["book", "status"]),
        ]

    def __str__(self):
        return f"{self.book.title} - {self.barcode}"


# ============================================================
# CIRCULATION
# ============================================================

class Loan(BaseModel):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        RETURNED = "RETURNED", "Returned"
        OVERDUE = "OVERDUE", "Overdue"
        LOST = "LOST", "Lost"

    member = models.ForeignKey(
        Member,
        on_delete=models.PROTECT,
        related_name="loans",
    )
    book_copy = models.ForeignKey(
        BookCopy,
        on_delete=models.PROTECT,
        related_name="loans",
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="loans_issued",
    )
    returned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loans_returned",
    )
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    renewal_count = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-issue_date"]
        indexes = [
            models.Index(fields=["member", "status"]),
            models.Index(fields=["due_date", "status"]),
        ]

    def __str__(self):
        return (
            f"{self.book_copy} - "
            f"{self.member.membership_number}"
        )


class LoanRenewal(BaseModel):
    loan = models.ForeignKey(
        Loan,
        on_delete=models.PROTECT,
        related_name="renewals",
    )
    previous_due_date = models.DateField()
    new_due_date = models.DateField()
    renewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="loan_renewals",
    )
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Renewal for loan {self.loan_id}"


# ============================================================
# FINES AND PAYMENTS
# ============================================================

class Fine(BaseModel):

    class FineType(models.TextChoices):
        OVERDUE = "OVERDUE", "Overdue"
        LOST_BOOK = "LOST_BOOK", "Lost book"
        DAMAGE = "DAMAGE", "Damage"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PARTIAL = "PARTIAL", "Partially paid"
        PAID = "PAID", "Paid"
        WAIVED = "WAIVED", "Waived"

    loan = models.ForeignKey(
        Loan,
        on_delete=models.PROTECT,
        related_name="fines",
    )
    fine_type = models.CharField(
        max_length=20,
        choices=FineType.choices,
        default=FineType.OVERDUE,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.UNPAID,
    )
    description = models.TextField(blank=True)
    waived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fines_waived",
    )
    waived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Fine #{self.pk} - {self.amount}"


class FinePayment(BaseModel):

    class PaymentMethod(models.TextChoices):
        CASH = "CASH", "Cash"
        CARD = "CARD", "Card"
        MOBILE_MONEY = "MOBILE_MONEY", "Mobile money"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank transfer"
        OTHER = "OTHER", "Other"

    fine = models.ForeignKey(
        Fine,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )
    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="fine_payments_received",
    )
    paid_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-paid_at"]

    def __str__(self):
        return f"Payment {self.pk} - {self.amount}"


# ============================================================
# NOTIFICATIONS
# ============================================================

class Notification(BaseModel):

    class NotificationType(models.TextChoices):
        LOAN_DUE = "LOAN_DUE", "Loan due"
        OVERDUE = "OVERDUE", "Overdue reminder"
        LOAN_RETURNED = "LOAN_RETURNED", "Loan returned"
        RESERVATION = "RESERVATION", "Reservation update"
        FINE = "FINE", "Fine notice"
        MEMBERSHIP = "MEMBERSHIP", "Membership notice"
        GENERAL = "GENERAL", "General"

    class Channel(models.TextChoices):
        IN_APP = "IN_APP", "In-app"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        READ = "READ", "Read"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )
    channel = models.CharField(
        max_length=10,
        choices=Channel.choices,
        default=Channel.IN_APP,
    )
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "status"]),
        ]

    def __str__(self):
        return self.subject


# ============================================================
# AUDIT
# ============================================================

class AuditLog(BaseModel):

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        ISSUE = "ISSUE", "Issue book"
        RETURN = "RETURN", "Return book"
        PAYMENT = "PAYMENT", "Payment"
        OTHER = "OTHER", "Other"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=10, choices=Action.choices)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["action", "created_at"]),
        ]

    def __str__(self):
        return (
            f"{self.action} - {self.entity_type} "
            f"#{self.entity_id}"
        )
