import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
  Activity,
  Layers,
  Clock,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// API Base URL - Update according to your Django backend host
const API_BASE_URL = 'http://127.0.0.1:8000/api/audit';

const Audit = () => {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Helper: Get Auth Headers (Adjust token retrieval key as needed)
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

  // Fetch Summary Cards Data
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE_URL}/summary/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load audit summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Fetch Audit Logs List
  const fetchLogs = useCallback(async (pageUrl = null) => {
    setLoadingLogs(true);
    setError(null);

    let url = pageUrl;
    if (!url) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (action) params.append('action', action);
      if (entityType) params.append('entity_type', entityType);
      if (actorId) params.append('actor', actorId);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', currentPage);

      url = `${API_BASE_URL}/logs/?${params.toString()}`;
    }

    try {
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.action || errorData.date_to || 'Failed to fetch logs');
      }
      const data = await res.json();

      // Handles Paginated Responses (Django Standard Pagination)
      if (data.results) {
        setLogs(data.results);
        setNextPageUrl(data.next);
        setPrevPageUrl(data.previous);
        setTotalCount(data.count);
      } else {
        // Fallback if pagination is disabled in backend
        setLogs(data);
        setTotalCount(data.length);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLogs(false);
    }
  }, [search, action, entityType, actorId, dateFrom, dateTo, currentPage]);

  // Fetch Specific Detail Record
  const fetchLogDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/logs/${id}/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch details.');
      const data = await res.json();
      setSelectedLog(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Initial load & Filter change effect
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setAction('');
    setEntityType('');
    setActorId('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Badge Color Mapper for Action Types
  const getActionBadge = (actionName) => {
    const act = actionName?.toUpperCase() || '';
    if (act.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (act.includes('UPDATE')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (act.includes('DELETE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit & System Activity Logs</h1>
          <p className="text-sm text-slate-500">
            Monitor activity, track model changes, and audit security events across the library system.
          </p>
        </div>
        <button
          onClick={() => {
            fetchSummary();
            fetchLogs();
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Summary KPI Cards                                                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Logs</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {loadingSummary ? '...' : summary?.total_logs?.toLocaleString() || 0}
            </h3>
          </div>
        </div>

        {/* Card 2: Today's Logs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Activity</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {loadingSummary ? '...' : summary?.today_logs?.toLocaleString() || 0}
            </h3>
          </div>
        </div>

        {/* Card 3: Top Action */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions breakdown</p>
            <div className="text-xs text-slate-600 mt-1 flex gap-2 flex-wrap">
              {summary?.actions &&
                Object.entries(summary.actions).map(([act, count]) => (
                  <span key={act} className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                    {act}: {count}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Card 4: Top Entity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracked Entities</p>
            <div className="text-xs text-slate-600 mt-1 flex gap-1 flex-wrap">
              {summary?.entities &&
                Object.entries(summary.entities)
                  .slice(0, 3)
                  .map(([entity, count]) => (
                    <span key={entity} className="font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      {entity}: {count}
                    </span>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Filters Bar                                                         */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Filter className="w-4 h-4" /> Filter Logs
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Entity Type Filter */}
          <input
            type="text"
            placeholder="Entity (e.g. Book, Loan)"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />

          {/* Actor User ID Filter */}
          <input
            type="number"
            placeholder="Actor User ID"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />

          {/* Date From */}
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Logs Table                                                          */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Entity ID</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingLogs ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No audit records match your search criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    {/* Action Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity Type */}
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {log.entity_type}
                    </td>

                    {/* Entity ID */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      #{log.entity_id}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {log.actor?.username?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
                        </div>
                        <span className="text-slate-700 text-xs">
                          {log.actor?.username || log.actor?.email || 'System'}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.description}>
                      {log.description || '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => fetchLogDetail(log.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="View JSON Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Controls */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <div>
            Showing <span className="font-semibold">{logs.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!prevPageUrl && currentPage === 1}
              onClick={() => {
                if (prevPageUrl) fetchLogs(prevPageUrl);
                else setCurrentPage((prev) => Math.max(prev - 1, 1));
              }}
              className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">Page {currentPage}</span>
            <button
              disabled={!nextPageUrl}
              onClick={() => {
                if (nextPageUrl) fetchLogs(nextPageUrl);
                else setCurrentPage((prev) => prev + 1);
              }}
              className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Detail View Drawer / Modal                                         */}
      {/* ------------------------------------------------------------------- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">
                  Audit Record Detail #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Entity Type</span>
                  <span className="text-slate-800 font-semibold">{selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Entity ID</span>
                  <span className="text-slate-800 font-semibold">{selectedLog.entity_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Action</span>
                  <span className="text-slate-800 font-semibold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Actor</span>
                  <span className="text-slate-800 font-semibold">
                    {selectedLog.actor?.username || selectedLog.actor?.email || 'System'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Timestamp</span>
                  <span className="text-slate-800 font-semibold">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-xs block font-medium mb-1">Description</span>
                <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedLog.description || 'No description provided.'}
                </p>
              </div>

              {/* Payload/Changes JSON standard DRF View */}
              {selectedLog.changes && (
                <div>
                  <span className="text-slate-400 text-xs block font-medium mb-1">
                    Delta / Changes Payload
                  </span>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;