from django.db import models
from django.contrib.auth.models import AbstractUser


# ============================================================
# BASE MODEL
# ============================================================

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
    """Custom user model for the entire system."""

    phone_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.username


# ============================================================
# ADMINISTRATION
# ============================================================

class School(BaseModel):
    """Stores basic school information."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name


# ============================================================
# STAFF
# ============================================================

class Staff(BaseModel):
    """Stores teacher and employee information."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_profile"
    )

    staff_number = models.CharField(max_length=50, unique=True)
    designation = models.CharField(max_length=100)
    employment_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.staff_number


# ============================================================
# STUDENTS
# ============================================================

class Student(BaseModel):
    """Stores student personal and registration information."""

    admission_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    other_names = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Guardian(BaseModel):
    """Stores parent and guardian information (Admin management only)."""

    # Remove the 'user' field entirely:
    # user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, ...)

    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    relationship = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.full_name

class StudentGuardian(BaseModel):
    """Links students to their parents or guardians."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="guardians"
    )

    guardian = models.ForeignKey(
        Guardian,
        on_delete=models.CASCADE,
        related_name="students"
    )

    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student} - {self.guardian}"


# ============================================================
# ACADEMICS
# ============================================================

class AcademicYear(BaseModel):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Term(BaseModel):
    name = models.CharField(max_length=50)
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="terms"
    )

    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class ClassRoom(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Subject(BaseModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return self.name


class Enrollment(BaseModel):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="enrollments"
    )

    enrollment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} in {self.classroom}"


# ============================================================
# ATTENDANCE
# ============================================================

class StudentAttendance(BaseModel):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    date = models.DateField()

    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("excused", "Excused"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="present"
    )

    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"{self.student} - {self.date} ({self.status})"


# ============================================================
# EXAMINATIONS
# ============================================================

class Examination(BaseModel):
    name = models.CharField(max_length=100)
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT
    )
    term = models.ForeignKey(
        Term,
        on_delete=models.PROTECT
    )
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.name


class StudentResult(BaseModel):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="results"
    )

    examination = models.ForeignKey(
        Examination,
        on_delete=models.CASCADE,
        related_name="results"
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT
    )

    marks = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.student} - {self.subject}: {self.marks}"


# ============================================================
# FINANCE
# ============================================================

class FeeCategory(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class FeePayment(BaseModel):
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    reference_number = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.student} - {self.amount}"


# ============================================================
# COMMUNICATION
# ============================================================

class Announcement(BaseModel):
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="announcements"
    )
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title