import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Search,
  Filter,
  FileText,
  CreditCard,
  User,
  BookOpen,
  X,
  AlertCircle
} from 'lucide-react';

// API Base URL - Adjust according to your Django backend setup
const API_BASE_URL = 'http://127.0.0.1:8000/api/fines';

const Fines = () => {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('fines'); // 'fines' | 'overdue' | 'payments'
  const [dashboard, setDashboard] = useState(null);
  
  // Data Lists
  const [fines, setFines] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [payments, setPayments] = useState([]);

  // Loading & Error States
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [membershipFilter, setMembershipFilter] = useState('');
  const [fineStatusFilter, setFineStatusFilter] = useState('');
  const [fineTypeFilter, setFineTypeFilter] = useState('');

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    fine_id: '',
    amount: '',
    payment_method: 'CASH',
    transaction_reference: '',
    notes: '',
  });

  // Helper: Get Auth Headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  // Fetch Dashboard Stats
  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load fines dashboard data.');
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Fetch Fines List
  const fetchFines = useCallback(async () => {
    setLoadingTable(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (membershipFilter) params.append('membership_number', membershipFilter);
      if (fineStatusFilter) params.append('status', fineStatusFilter);
      if (fineTypeFilter) params.append('fine_type', fineTypeFilter);

      const res = await fetch(`${API_BASE_URL}/list/?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch fines list.');
      const data = await res.json();
      setFines(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTable(false);
    }
  }, [membershipFilter, fineStatusFilter, fineTypeFilter]);

  // Fetch Overdue Loans List
  const fetchOverdueLoans = useCallback(async () => {
    setLoadingTable(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (membershipFilter) params.append('membership_number', membershipFilter);

      const res = await fetch(`${API_BASE_URL}/overdue/?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch overdue loans.');
      const data = await res.json();
      setOverdueLoans(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTable(false);
    }
  }, [membershipFilter]);

  // Fetch Payment History List
  const fetchPayments = useCallback(async () => {
    setLoadingTable(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch payment history.');
      const data = await res.json();
      setPayments(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTable(false);
    }
  }, []);

  // Trigger appropriate fetch based on active tab
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (activeTab === 'fines') fetchFines();
    else if (activeTab === 'overdue') fetchOverdueLoans();
    else if (activeTab === 'payments') fetchPayments();
  }, [activeTab, fetchFines, fetchOverdueLoans, fetchPayments]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  // Trigger Process Overdue Loans Task
  const handleProcessOverdue = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/process-overdue/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to process overdue loans.');
      const result = await res.json();
      alert(`Success! ${result.loans_marked_overdue} loans marked overdue for ${result.date}.`);
      fetchDashboard();
      if (activeTab === 'overdue') fetchOverdueLoans();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Record Fine Payment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/record/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...paymentForm,
          fine_id: parseInt(paymentForm.fine_id, 10),
          amount: parseFloat(paymentForm.amount),
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      alert('Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      setPaymentForm({ fine_id: '', amount: '', payment_method: 'CASH', transaction_reference: '', notes: '' });
      fetchDashboard();
      fetchFines();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Badge Status Mappers
  const getFineStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIAL':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNPAID':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 font-sans">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fines & Overdue Management</h1>
          <p className="text-sm text-slate-500">
            Monitor library dues, record fee payments, and process overdue loan penalties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={actionLoading}
            onClick={handleProcessOverdue}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /> Process Overdue
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Summary KPI Cards                                                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Loans</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {loadingDashboard ? '...' : dashboard?.overdue_loans ?? 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Loans</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {loadingDashboard ? '...' : dashboard?.active_loans ?? 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Fines</p>
            <h3 className="text-2xl font-bold text-slate-800">
              ${loadingDashboard ? '...' : dashboard?.outstanding_fines ?? '0.00'}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected Today</p>
            <h3 className="text-2xl font-bold text-slate-800">
              ${loadingDashboard ? '...' : dashboard?.payments_collected_today ?? '0.00'}
            </h3>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Navigation Tabs & Filters                                           */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('fines')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'fines'
                ? 'bg-white text-indigo-600 border-slate-200'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Fines Registry
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'overdue'
                ? 'bg-white text-indigo-600 border-slate-200'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Overdue Loans
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'payments'
                ? 'bg-white text-indigo-600 border-slate-200'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Payment History
          </button>
        </div>

        {/* Filter Toolbar (Applicable for Fines & Overdue Tabs) */}
        {activeTab !== 'payments' && (
          <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by Membership Number..."
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {activeTab === 'fines' && (
              <>
                <select
                  value={fineStatusFilter}
                  onChange={(e) => setFineStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>

                <select
                  value={fineTypeFilter}
                  onChange={(e) => setFineTypeFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Fine Types</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="LOST">Lost</option>
                </select>
              </>
            )}

            <button
              onClick={() => {
                if (activeTab === 'fines') fetchFines();
                else fetchOverdueLoans();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* Table Contents                                                      */}
        {/* ------------------------------------------------------------------- */}
        <div className="overflow-x-auto">
          {loadingTable ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading records...
            </div>
          ) : activeTab === 'fines' ? (
            /* FINES TABLE */
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No fines recorded matching criteria.
                    </td>
                  </tr>
                ) : (
                  fines.map((fine) => (
                    <tr key={fine.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs">#{fine.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {fine.loan?.member?.membership_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4">{fine.fine_type}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">${fine.amount}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">${fine.amount_paid}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getFineStatusBadge(fine.status)}`}>
                          {fine.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(fine.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'overdue' ? (
            /* OVERDUE LOANS TABLE */
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Loan ID</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No overdue loans found.
                    </td>
                  </tr>
                ) : (
                  overdueLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs">#{loan.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {loan.member?.membership_number} ({loan.member?.first_name} {loan.member?.last_name})
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {loan.book_copy?.book?.title || 'Unknown Book'}
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{loan.due_date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* PAYMENT HISTORY TABLE */
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Fine ID</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Received By</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs">#{payment.id}</td>
                      <td className="py-3 px-4 font-mono text-xs">#{payment.fine}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">${payment.amount}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{payment.payment_method}</td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{payment.transaction_reference || '-'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">Admin #{payment.received_by}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{new Date(payment.paid_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Record Payment Modal                                                */}
      {/* ------------------------------------------------------------------- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Record Fine Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fine ID *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 12"
                  value={paymentForm.fine_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, fine_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method *</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. MPESA-QXYZ1234"
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional remarks..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;