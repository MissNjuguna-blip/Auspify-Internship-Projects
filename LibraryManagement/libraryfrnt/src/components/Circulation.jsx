import React, { useState, useEffect } from 'react';
import api from './context/api/api';
// const API_BASE_URL = 'circulation/';

const Circulation = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [loans, setLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Issue Form State
  const [issueForm, setIssueForm] = useState({
    member: '',
    book_copy: '',
    due_date: '',
    notes: '',
  });

  // Renewal Modal / Form State
  const [renewModalLoan, setRenewModalLoan] = useState(null);
  const [renewForm, setRenewForm] = useState({
    new_due_date: '',
    reason: '',
  });

  // Helper for Auth Headers
//   const getAuthHeaders = () => {
//     const token = localStorage.getItem('access_token');
//     return {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     };
//   };

  // API Fetch Functions
    // Fetch circulation summary
    const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
        const response = await api.get('circulation/summary/');
        setSummary(response.data);
    } catch (err) {
        console.error('Summary Error:', err);
        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to fetch circulation summary.'
        );
    } finally {
        setLoading(false);
    }
    };

    // Fetch all loans
    const fetchLoans = async () => {
    setLoading(true);
    setError(null);

    try {
        const response = await api.get('circulation/loans/', {
        params: {
            search: searchQuery || undefined,
            status: statusFilter || undefined,
        },
        });

        setLoans(response.data.results || response.data);
    } catch (err) {
        console.error('Loans Error:', err);
        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to fetch loans.'
        );
    } finally {
        setLoading(false);
    }
    };

    // Fetch overdue loans
    const fetchOverdueLoans = async () => {
    setLoading(true);
    setError(null);

    try {
        const response = await api.get('circulation/overdue/');
        setOverdueLoans(response.data.results || response.data);
    } catch (err) {
        console.error('Overdue Error:', err);
        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to fetch overdue loans.'
        );
    } finally {
        setLoading(false);
    }
    };

    // Fetch renewal history
    const fetchRenewals = async () => {
    setLoading(true);
    setError(null);

    try {
        const response = await api.get('circulation/renewals/');
        setRenewals(response.data.results || response.data);
    } catch (err) {
        console.error('Renewals Error:', err);
        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to fetch renewals.'
        );
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    setError(null);
    setSuccessMessage(null);

    if (activeTab === 'summary') fetchSummary();
    if (activeTab === 'loans') fetchLoans();
    if (activeTab === 'overdue') fetchOverdueLoans();
    if (activeTab === 'renewals') fetchRenewals();
    }, [activeTab]);
    // Actions
    const handleReturn = async (loanId) => {
    try {
        await api.post(
        `circulation/loans/${loanId}/return/`,
        { notes: 'Returned via dashboard' }
        );

        setSuccessMessage('Book returned successfully!');

        fetchLoans();
        fetchOverdueLoans();

    } catch (err) {
        console.error('Return Error:', err);
        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to process book return.'
        );
    }
    };
    const handleIssueSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);

    try {
        await api.post('circulation/issue/', {
        member: parseInt(issueForm.member, 10),
        book_copy: parseInt(issueForm.book_copy, 10),
        due_date: issueForm.due_date,
        notes: issueForm.notes,
        });

        setSuccessMessage('Book issued successfully!');

        setIssueForm({
        member: '',
        book_copy: '',
        due_date: '',
        notes: '',
        });

    } catch (err) {
        console.error('Issue Error:', err);

        setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        'Failed to issue book.'
        );
    }
    };
    const handleRenewSubmit = async (e) => {
    e.preventDefault();

    if (!renewModalLoan) return;

    setError(null);
    setSuccessMessage(null);

    try {
        await api.post(
        `circulation/loans/${renewModalLoan.id}/renew/`,
        {
            new_due_date: renewForm.new_due_date,
            reason: renewForm.reason,
        }
        );

        setSuccessMessage('Loan renewed successfully!');

        setRenewModalLoan(null);

        setRenewForm({
        new_due_date: '',
        reason: '',
        });

        fetchLoans();

    } catch (err) {
        console.error('Renewal Error:', err);

        setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        'Failed to renew loan.'
        );
    }
    };
    const handleRefreshOverdue = async () => {
    try {
        const response = await api.post(
        'circulation/refresh-overdue/'
        );

        setSuccessMessage(
        response.data.message ||
        'Overdue statuses refreshed successfully.'
        );

        if (activeTab === 'summary') fetchSummary();
        if (activeTab === 'overdue') fetchOverdueLoans();

    } catch (err) {
        console.error('Refresh Error:', err);

        setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to refresh overdue statuses.'
        );
    }
    };
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header & Quick Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Library Circulation Dashboard</h1>
            <p className="text-gray-600">Manage issues, returns, renewals, and live library inventory.</p>
          </div>
          <button
            onClick={handleRefreshOverdue}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            Refresh Overdue Statuses
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6 pb-2">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'loans', label: 'Loans' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'renewals', label: 'Renewal History' },
            { id: 'issue', label: 'Issue Book' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-500">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summary.loans.total}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-500">Active Loans</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{summary.loans.active}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-500">Overdue Loans</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.loans.overdue}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-medium text-gray-500">Returns Today</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.returns_today}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                {Object.entries(summary.inventory).map(([key, val]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{key.replace('_', ' ')}</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOANS LIST */}
        {activeTab === 'loans' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <input
                type="text"
                placeholder="Search member, barcode, title, ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none flex-1 text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="returned">Returned</option>
                  <option value="lost">Lost</option>
                </select>
                <button
                  onClick={fetchLoans}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Book Copy</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">#{loan.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{loan.member}</td>
                      <td className="py-3 px-4 text-gray-700">{loan.book_copy}</td>
                      <td className="py-3 px-4 text-gray-600">{loan.due_date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          loan.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          loan.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {loan.status !== 'returned' && (
                          <>
                            <button
                              onClick={() => setRenewModalLoan(loan)}
                              className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 font-medium"
                            >
                              Renew
                            </button>
                            <button
                              onClick={() => handleReturn(loan.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                            >
                              Return
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-500">No loans found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OVERDUE LOANS */}
        {activeTab === 'overdue' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Currently Overdue Loans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-3 px-4">Loan ID</th>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Book Copy</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {overdueLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">#{loan.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{loan.member}</td>
                      <td className="py-3 px-4 text-gray-700">{loan.book_copy}</td>
                      <td className="py-3 px-4 text-red-600 font-medium">{loan.due_date}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleReturn(loan.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                        >
                          Process Return
                        </button>
                      </td>
                    </tr>
                  ))}
                  {overdueLoans.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-500">No overdue loans found. Great job!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RENEWAL HISTORY */}
        {activeTab === 'renewals' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Renewal Activity Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-3 px-4">Renewal ID</th>
                    <th className="py-3 px-4">Loan ID</th>
                    <th className="py-3 px-4">Previous Due Date</th>
                    <th className="py-3 px-4">New Due Date</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {renewals.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">#{item.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">#{item.loan}</td>
                      <td className="py-3 px-4 text-gray-600">{item.previous_due_date}</td>
                      <td className="py-3 px-4 text-blue-600 font-medium">{item.new_due_date}</td>
                      <td className="py-3 px-4 text-gray-700">{item.reason || 'N/A'}</td>
                    </tr>
                  ))}
                  {renewals.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-500">No renewal records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ISSUE BOOK FORM */}
        {activeTab === 'issue' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Book Copy</h2>
            <form onSubmit={handleIssueSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Member ID</label>
                <input
                  type="number"
                  required
                  value={issueForm.member}
                  onChange={(e) => setIssueForm({ ...issueForm, member: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Book Copy ID</label>
                <input
                  type="number"
                  required
                  value={issueForm.book_copy}
                  onChange={(e) => setIssueForm({ ...issueForm, book_copy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={issueForm.due_date}
                  onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Remarks..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
              >
                Issue Book
              </button>
            </form>
          </div>
        )}

        {/* RENEW LOAN MODAL */}
        {renewModalLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Renew Loan #{renewModalLoan.id}</h3>
              <p className="text-xs text-gray-500 mb-4">Current Due Date: {renewModalLoan.due_date}</p>
              <form onSubmit={handleRenewSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">New Due Date</label>
                  <input
                    type="date"
                    required
                    value={renewForm.new_due_date}
                    onChange={(e) => setRenewForm({ ...renewForm, new_due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Reason for Extension</label>
                  <textarea
                    value={renewForm.reason}
                    onChange={(e) => setRenewForm({ ...renewForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="3"
                    placeholder="Member requested extension..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Confirm Renewal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewModalLoan(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-6 text-gray-500 text-sm">Loading data...</div>
        )}
      </div>
    </div>
  );
};

export default Circulation;

