
from django.urls import path

from circulation.views import (
    LoanListView,
    LoanDetailView,
    IssueBookView,
    ReturnBookView,
    RenewLoanView,
    OverdueLoanListView,
    LoanRenewalListView,
    RefreshOverdueLoansView,
    CirculationSummaryView,
)

app_name = "circulation"

urlpatterns = [
    # List loans
    path(
        "loans/",
        LoanListView.as_view(),
        name="loan-list",
    ),

    # Get loan details
    path(
        "loans/<int:pk>/",
        LoanDetailView.as_view(),
        name="loan-detail",
    ),

    # Issue a book
    path(
        "issue/",
        IssueBookView.as_view(),
        name="issue-book",
    ),

    # Return a book
    path(
        "loans/<int:pk>/return/",
        ReturnBookView.as_view(),
        name="loan-return",
    ),

    # Renew a loan
    path(
        "loans/<int:pk>/renew/",
        RenewLoanView.as_view(),
        name="loan-renew",
    ),

    # List overdue loans
    path(
        "overdue/",
        OverdueLoanListView.as_view(),
        name="overdue-loans",
    ),

    # Loan renewal history
    path(
        "renewals/",
        LoanRenewalListView.as_view(),
        name="loan-renewals",
    ),

    # Refresh overdue statuses
    path(
        "refresh-overdue/",
        RefreshOverdueLoansView.as_view(),
        name="refresh-overdue",
    ),

    # Circulation dashboard summary
    path(
        "summary/",
        CirculationSummaryView.as_view(),
        name="circulation-summary",
    ),
]
