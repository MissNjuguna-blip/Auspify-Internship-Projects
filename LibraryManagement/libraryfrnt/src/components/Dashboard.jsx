import React, { useState, useEffect } from 'react';
import api from './context/api/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await api.get("core/admin-dashboard/");
      setDashboardData(response.data);

    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-stone-600 text-sm font-medium">
        <i className="bi bi-book-half animate-pulse text-2xl mr-2 text-emerald-700"></i>
        Opening library records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 text-stone-800 rounded-2xl text-sm max-w-xl mx-auto mt-8 shadow-sm">
        <div className="flex items-center space-x-2 font-semibold mb-1 text-rose-800">
          <i className="bi bi-exclamation-triangle-fill text-lg"></i>
          <span>Dashboard Notice</span>
        </div>
        <p>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-emerald-800 text-stone-50 rounded-xl text-xs font-medium hover:bg-emerald-900 transition-colors shadow-sm"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const {
    summary = {},
    recent_loans = [],
    recent_members = [],
    recent_books = [],
    recent_fines = [],
    recent_audit_logs = [],
    today = ''
  } = dashboardData || {};

  return (
    <div className="space-y-6 font-serif">
      {/* Top Header Banner */}
      <div className="bg-[#fcfbf9] p-6 rounded-3xl shadow-sm border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
            <i className="bi bi-journal-bookmark-fill"></i>
            <span>Reading Room Date: {today}</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Library Archives & Control Center</h1>
          <p className="text-sm text-stone-600 font-sans">Cozy, real-time overview of your collection, patrons, circulation, and registers.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-2xl text-sm font-sans font-medium transition-all shadow-sm flex items-center space-x-2"
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh Shelves</span>
        </button>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        {/* Total Books */}
        <div className="bg-[#fcfbf9] p-5 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Catalog Volumes</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{summary?.total_books || 0}</p>
            <p className="text-xs text-emerald-800 font-medium mt-1">{summary?.total_copies || 0} Total Physical Copies</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-book"></i>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-[#fcfbf9] p-5 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Patrons</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{summary?.active_members || 0}</p>
            <p className="text-xs text-emerald-700 font-medium mt-1">Out of {summary?.total_members || 0} enrolled</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#eef3ee] text-emerald-700 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-people"></i>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-[#fcfbf9] p-5 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Checked Out</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{summary?.active_loans || 0}</p>
            <p className="text-xs text-amber-800 font-medium mt-1">{summary?.overdue_loans || 0} Overdue Books</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-journal-check"></i>
          </div>
        </div>

        {/* Outstanding Fines */}
        <div className="bg-[#fcfbf9] p-5 rounded-3xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Outstanding Dues</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">KSh {summary?.outstanding_fines || '0.00'}</p>
            <p className="text-xs text-stone-600 font-medium mt-1">Collected: KSh {summary?.total_payments || '0.00'}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-200/70 text-stone-800 flex items-center justify-center text-xl shadow-inner">
            <i className="bi bi-cash-coin"></i>
          </div>
        </div>
      </div>

      {/* Inventory & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Inventory Status */}
        <div className="bg-[#fcfbf9] p-6 rounded-3xl shadow-sm border border-stone-200">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center font-serif">
            <i className="bi bi-box-seam text-emerald-800 mr-2"></i> Shelf & Copy Status
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#f6f5f2] p-3.5 rounded-2xl border border-stone-200/60">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Available</span>
              <p className="text-lg font-bold text-stone-900">{summary?.available_copies || 0}</p>
            </div>
            <div className="bg-[#f6f5f2] p-3.5 rounded-2xl border border-stone-200/60">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">On Loan</span>
              <p className="text-lg font-bold text-emerald-800">{summary?.copies_on_loan || 0}</p>
            </div>
            <div className="bg-[#f6f5f2] p-3.5 rounded-2xl border border-stone-200/60">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Reserved</span>
              <p className="text-lg font-bold text-amber-800">{summary?.reserved_copies || 0}</p>
            </div>
            <div className="bg-[#f6f5f2] p-3.5 rounded-2xl border border-stone-200/60">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Damaged / Lost</span>
              <p className="text-lg font-bold text-rose-800">{(summary?.damaged_copies || 0) + (summary?.lost_copies || 0)}</p>
            </div>
          </div>
        </div>

        {/* Member Statuses */}
        <div className="bg-[#fcfbf9] p-6 rounded-3xl shadow-sm border border-stone-200">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center font-serif">
            <i className="bi bi-person-badge text-emerald-800 mr-2"></i> Patron Demographics
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-stone-200/60">
              <span className="text-stone-600">Active Patrons</span>
              <span className="font-bold text-stone-900">{summary?.active_members || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-stone-200/60">
              <span className="text-stone-600">Suspended / Expired</span>
              <span className="font-bold text-rose-800">{(summary?.suspended_members || 0) + (summary?.expired_members || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-stone-600">Total Enrolled</span>
              <span className="font-bold text-emerald-800">{summary?.total_members || 0}</span>
            </div>
          </div>
        </div>

        {/* Notifications Alert Panel */}
        <div className="bg-[#fcfbf9] p-6 rounded-3xl shadow-sm border border-stone-200">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center font-serif">
            <i className="bi bi-bell text-emerald-800 mr-2"></i> Notice Board & Queue
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-stone-200/60">
              <span className="text-stone-600">Pending Dispatch</span>
              <span className="font-bold text-amber-800">{summary?.pending_notifications || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-stone-200/60">
              <span className="text-stone-600">Unread Patron Notices</span>
              <span className="font-bold text-emerald-800">{summary?.unread_notifications || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-stone-600">Failed Dispatches</span>
              <span className="font-bold text-rose-800">{summary?.failed_notifications || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections (Tabs) */}
      <div className="bg-[#fcfbf9] rounded-3xl shadow-sm border border-stone-200 overflow-hidden font-sans">
        <div className="flex flex-wrap border-b border-stone-200 bg-[#f6f5f2] px-6 pt-4 gap-2">
          {[
            { id: 'overview', label: 'Recent Loans', icon: 'bi-journal-text' },
            { id: 'members', label: 'Recent Patrons', icon: 'bi-people' },
            { id: 'books', label: 'Recent Books', icon: 'bi-book' },
            { id: 'fines', label: 'Recent Dues', icon: 'bi-cash-coin' },
            { id: 'audit', label: 'Library Logs', icon: 'bi-shield-lock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-2xl transition-all flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-[#fcfbf9] text-emerald-900 border-t border-x border-stone-200 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <i className={`bi ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 1: RECENT LOANS */}
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Patron</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent_loans?.map((loan) => (
                    <tr key={loan.id} className="hover:bg-[#f6f5f2]/60">
                      <td className="py-3 px-4 font-medium text-stone-900 font-serif">
                        {loan.member_name} <span className="text-xs text-stone-500 font-sans">({loan.membership_number})</span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 font-serif">{loan.book_title}</td>
                      <td className="py-3 px-4 text-stone-600">{loan.issue_date}</td>
                      <td className="py-3 px-4 text-stone-600">{loan.due_date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          loan.status === 'active' ? 'bg-emerald-100/80 text-emerald-900' :
                          loan.status === 'overdue' ? 'bg-rose-100/80 text-rose-900' : 'bg-stone-200/80 text-stone-800'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: RECENT MEMBERS */}
          {activeTab === 'members' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Patron #</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent_members?.map((m) => (
                    <tr key={m.id} className="hover:bg-[#f6f5f2]/60">
                      <td className="py-3 px-4 font-medium text-stone-900 font-serif">{m.full_name}</td>
                      <td className="py-3 px-4 text-stone-700">{m.membership_number}</td>
                      <td className="py-3 px-4 text-stone-600">{m.email}</td>
                      <td className="py-3 px-4 text-stone-600 uppercase text-xs">{m.membership_type}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-900">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: RECENT BOOKS */}
          {activeTab === 'books' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">ISBN</th>
                    <th className="py-3 px-4">Authors</th>
                    <th className="py-3 px-4">Publisher</th>
                    <th className="py-3 px-4">Available Copies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent_books?.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f6f5f2]/60">
                      <td className="py-3 px-4 font-medium text-stone-900 font-serif">{b.title}</td>
                      <td className="py-3 px-4 text-stone-700">{b.isbn}</td>
                      <td className="py-3 px-4 text-stone-600 font-serif">{b.authors?.join(', ')}</td>
                      <td className="py-3 px-4 text-stone-600 font-serif">{b.publisher || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-emerald-800">{b.available_copies} / {b.total_copies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: RECENT FINES */}
          {activeTab === 'fines' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Patron</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent_fines?.map((f) => (
                    <tr key={f.id} className="hover:bg-[#f6f5f2]/60">
                      <td className="py-3 px-4 font-medium text-stone-900 font-serif">{f.member}</td>
                      <td className="py-3 px-4 text-stone-700 font-serif">{f.book_title}</td>
                      <td className="py-3 px-4 text-stone-800 font-semibold">KSh {f.amount}</td>
                      <td className="py-3 px-4 text-rose-800 font-semibold">KSh {f.balance}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          f.status === 'paid' ? 'bg-emerald-100/80 text-emerald-900' : 'bg-amber-100/80 text-amber-900'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recent_audit_logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f6f5f2]/60">
                      <td className="py-3 px-4 font-medium text-stone-900">{log.actor || 'System'}</td>
                      <td className="py-3 px-4 text-emerald-800 font-semibold">{log.action}</td>
                      <td className="py-3 px-4 text-stone-700">{log.entity_type}</td>
                      <td className="py-3 px-4 text-stone-600">{log.description}</td>
                      <td className="py-3 px-4 text-stone-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;