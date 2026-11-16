
import React, { useEffect, useState, useCallback } from "react";
// import api from "../api/api";
import {
  CalendarDays,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Briefcase,
  CalendarCheck,
  FileText,
  Wallet,
  BarChart3,
  UserRound,
} from "lucide-react";
import api from "./context/api/api";

const LeaveManagement = () => {
  // =====================================================
  // CONFIGURATION
  // =====================================================

  const currentYear = new Date().getFullYear();

  const [activeTab, setActiveTab] = useState("dashboard");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    page: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    year: currentYear,
    department: "",
    employee: "",
    leave_type: "",
  });

  const [modal, setModal] = useState({
    open: false,
    type: "",
    data: null,
  });

  const [formData, setFormData] = useState({});

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewComment, setReviewComment] = useState("");

  const [reportData, setReportData] = useState([]);

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");
    setTimeout(() => setSuccess(""), 4000);
  };

  const showError = (err) => {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      "Something went wrong. Please try again.";

    setError(message);
    setSuccess("");
  };

  // Additional sections follow below.

  // =====================================================
  // API FUNCTIONS
  // =====================================================

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get(
        `/leave_management/dashboard/?year=${filters.year}`
      );

      setDashboard(response.data);
    } catch (err) {
      showError(err);
    }
  }, [filters.year]);

  const fetchLeaveRequests = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        page_size: 20,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.employee) params.employee = filters.employee;
      if (filters.leave_type) params.leave_type = filters.leave_type;
      if (filters.department) params.department = filters.department;

      const response = await api.get(
        "/leave_management/requests/",
        { params }
      );

      setLeaveRequests(response.data.results || []);

      setPagination({
        count: response.data.count || 0,
        next: response.data.next,
        previous: response.data.previous,
        page,
      });
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.status,
    filters.employee,
    filters.leave_type,
    filters.department,
  ]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await api.get(
        "/leave_management/types/?active=true"
      );

      setLeaveTypes(response.data.results || []);
    } catch (err) {
      showError(err);
    }
  }, []);

  const fetchLeaveBalances = useCallback(async () => {
    try {
      const response = await api.get(
        "leave_management/balances/",
        {
          params: {
            year: filters.year,
            page_size: 100,
          },
        }
      );

      setLeaveBalances(response.data.results || []);
    } catch (err) {
      showError(err);
    }
  }, [filters.year]);

  const refreshData = async () => {
    await Promise.all([
      fetchDashboard(),
      fetchLeaveRequests(),
      fetchLeaveTypes(),
      fetchLeaveBalances(),
    ]);
  };

  useEffect(() => {
    refreshData();
  }, [
    fetchDashboard,
    fetchLeaveRequests,
    fetchLeaveTypes,
    fetchLeaveBalances,
  ]);

  // =====================================================
  // FILTER HANDLING
  // =====================================================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      search: "",
      status: "",
      department: "",
      employee: "",
      leave_type: "",
    }));
  };

  // =====================================================
  // MODAL HANDLING
  // =====================================================

  const openModal = (type, data = null) => {
    setModal({
      open: true,
      type,
      data,
    });

    if (type === "request") {
      setFormData(
        data
          ? {
              employee: data.employee,
              leave_type: data.leave_type,
              start_date: data.start_date,
              end_date: data.end_date,
              days_requested: data.days_requested,
              reason: data.reason,
            }
          : {
              employee: "",
              leave_type: "",
              start_date: "",
              end_date: "",
              days_requested: "1",
              reason: "",
            }
      );
    }

    if (type === "type") {
      setFormData(
        data || {
          name: "",
          description: "",
          default_days: 0,
          is_paid: true,
          is_active: true,
        }
      );
    }

    if (type === "balance") {
      setFormData(
        data || {
          employee: "",
          leave_type: "",
          year: currentYear,
          allocated_days: "",
        }
      );
    }
  };

  const closeModal = () => {
    setModal({
      open: false,
      type: "",
      data: null,
    });

    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // FORM SUBMISSION
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (modal.type === "request") {
        const url = modal.data
          ? `leave_management/requests/${modal.data.id}/`
          : "/leave_management/requests/";

        if (modal.data) {
          await api.patch(url, formData);
        } else {
          await api.post(url, formData);
        }

        showSuccess("Leave request saved successfully.");
      }

      if (modal.type === "type") {
        const url = modal.data
          ? `leave_management/types/${modal.data.id}/`
          : "/leave_management/types/";

        if (modal.data) {
          await api.patch(url, formData);
        } else {
          await api.post(url, formData);
        }

        showSuccess("Leave type saved successfully.");
      }

      if (modal.type === "balance") {
        await api.post(
          "leave_management/balances/",
          formData
        );

        showSuccess("Leave balance allocated successfully.");
      }

      closeModal();

      await refreshData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // APPROVAL WORKFLOW
  // =====================================================

  const approveRequest = async (id) => {
    if (!window.confirm("Approve this leave request?")) return;

    try {
      setLoading(true);

      await api.post(
        `leave_management/requests/${id}/approve/`,
        {
          review_comment: reviewComment,
        }
      );

      showSuccess("Leave request approved successfully.");

      setReviewComment("");
      setSelectedRequest(null);

      await refreshData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (id) => {
    if (!reviewComment.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `leave_management/requests/${id}/reject/`,
        {
          review_comment: reviewComment,
        }
      );

      showSuccess("Leave request rejected.");

      setReviewComment("");
      setSelectedRequest(null);

      await refreshData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;

    try {
      setLoading(true);

      await api.post(
        `leave_management/requests/${id}/cancel/`,
        {
          review_comment: "Cancelled by administrator.",
        }
      );

      showSuccess("Leave request cancelled.");

      await refreshData();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this pending leave request?")) return;

    try {
      await api.delete(
        `leave_management/requests/${id}/`
      );

      showSuccess("Leave request deleted.");

      await refreshData();
    } catch (err) {
      showError(err);
    }
  };

  // =====================================================
  // STATUS BADGES
  // =====================================================

  const getStatusStyle = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      CANCELLED: "bg-gray-100 text-gray-600",
    };

    return styles[status] || "bg-gray-100 text-gray-600";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString();
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };

  // =====================================================
  // STATISTIC CARD
  // =====================================================

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h3 className="text-2xl font-bold text-gray-800 mt-2">
            {formatNumber(value)}
          </h3>

          <p className="text-xs text-gray-400 mt-1">
            {description}
          </p>
        </div>

        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  // =====================================================
  // DASHBOARD
  // =====================================================

  const Dashboard = () => {
    const stats = dashboard?.summary || {};

    return (
      <div className="space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <StatCard
            title="Total Requests"
            value={stats.total_requests}
            icon={ClipboardList}
            color="bg-blue-100 text-blue-600"
            description="All leave applications"
          />

          <StatCard
            title="Pending Requests"
            value={stats.pending_requests}
            icon={Clock}
            color="bg-amber-100 text-amber-600"
            description="Awaiting review"
          />

          <StatCard
            title="Approved Requests"
            value={stats.approved_requests}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
            description="Successfully approved"
          />

          <StatCard
            title="Rejected Requests"
            value={stats.rejected_requests}
            icon={XCircle}
            color="bg-red-100 text-red-600"
            description="Declined applications"
          />

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-5">
              Leave Overview
            </h3>

            <div className="space-y-5">

              {[
                {
                  label: "Approved Days",
                  value: stats.approved_days,
                  color: "bg-green-500",
                },
                {
                  label: "Pending Days",
                  value: stats.pending_days,
                  color: "bg-amber-500",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {item.label}
                    </span>

                    <span className="font-semibold">
                      {formatNumber(item.value)} days
                    </span>
                  </div>

                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full`}
                      style={{
                        width: `${
                          stats.approved_days || stats.pending_days
                            ? Math.min(
                                100,
                                (Number(item.value || 0) /
                                  Math.max(
                                    1,
                                    Number(stats.approved_days || 0) +
                                    Number(stats.pending_days || 0)
                                  )) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}

            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">
                  Cancelled Requests
                </p>

                <p className="text-xl font-bold text-gray-800 mt-1">
                  {formatNumber(stats.cancelled_requests)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">
                  Total Requests
                </p>

                <p className="text-xl font-bold text-gray-800 mt-1">
                  {formatNumber(stats.total_requests)}
                </p>
              </div>

            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">

            <h3 className="font-semibold text-gray-800 mb-5">
              Requests by Leave Type
            </h3>

            {dashboard?.by_leave_type?.length > 0 ? (
              <div className="space-y-4">

                {dashboard.by_leave_type.map((item, index) => (
                  <div key={index}>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {item.leave_type}
                      </span>

                      <span className="text-sm text-gray-500">
                        {item.total_requests} requests
                      </span>
                    </div>

                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${
                            item.total_requests
                              ? (item.approved / item.total_requests) * 100
                              : 0
                          }%`,
                        }}
                      />

                      <div
                        className="bg-amber-400"
                        style={{
                          width: `${
                            item.total_requests
                              ? (item.pending / item.total_requests) * 100
                              : 0
                          }%`,
                        }}
                      />

                      <div
                        className="bg-red-400"
                        style={{
                          width: `${
                            item.total_requests
                              ? (item.rejected / item.total_requests) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                  </div>
                ))}

              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No leave type statistics available.
              </p>
            )}

          </div>

        </div>

        <div className="bg-white rounded-xl border p-6">

          <h3 className="font-semibold text-gray-800 mb-5">
            Requests by Department
          </h3>

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">Department</th>
                  <th className="p-3">Total Requests</th>
                  <th className="p-3">Approved</th>
                  <th className="p-3">Pending</th>
                </tr>
              </thead>

              <tbody>

                {dashboard?.by_department?.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3 font-medium text-gray-700">
                      {item.department}
                    </td>

                    <td className="p-3">
                      {item.total_requests}
                    </td>

                    <td className="p-3 text-green-600">
                      {item.approved}
                    </td>

                    <td className="p-3 text-amber-600">
                      {item.pending}
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

            {!dashboard?.by_department?.length && (
              <p className="text-center py-6 text-gray-400">
                No department data available.
              </p>
            )}

          </div>
        </div>

      </div>
    );
  };

  // =====================================================
  // LEAVE REQUESTS
  // =====================================================

  const Requests = () => (
    <div className="bg-white rounded-xl border shadow-sm">

      <div className="p-5 border-b flex flex-col lg:flex-row justify-between gap-4">

        <div>
          <h3 className="font-semibold text-gray-800">
            Leave Applications
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Manage and review employee leave applications.
          </p>
        </div>

        <button
          onClick={() => openModal("request")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          New Request
        </button>

      </div>

      <div className="p-5 flex flex-col md:flex-row gap-3">

        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search employee or leave type..."
            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button
          onClick={clearFilters}
          className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          Clear Filters
        </button>

        <button
          onClick={() => fetchLeaveRequests(1)}
          className="border p-2 rounded-lg hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-left">

          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Leave Type</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Days</th>
              <th className="p-4">Status</th>
              <th className="p-4">Submitted</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>

            {leaveRequests.map((request) => (
              <tr key={request.id} className="border-t hover:bg-gray-50">

                <td className="p-4">
                  <p className="font-medium text-gray-800">
                    {request.employee_name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {request.employee_number}
                  </p>
                </td>

                <td className="p-4 text-gray-600">
                  {request.leave_type_name}
                </td>

                <td className="p-4 text-gray-600 whitespace-nowrap">
                  {formatDate(request.start_date)}
                  <br />
                  <span className="text-gray-400">to</span>
                  <br />
                  {formatDate(request.end_date)}
                </td>

                <td className="p-4 font-medium">
                  {request.days_requested}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(request.status)}`}
                  >
                    {request.status}
                  </span>
                </td>

                <td className="p-4 text-gray-500">
                  {formatDate(request.created_at?.slice(0, 10))}
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye size={17} />
                    </button>

                    {request.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => openModal("request", request)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                          title="Edit"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          onClick={() => deleteRequest(request.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}

                    {(request.status === "PENDING" ||
                      request.status === "APPROVED") && (
                      <button
                        onClick={() => cancelRequest(request.id)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <XCircle size={17} />
                      </button>
                    )}

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

        {leaveRequests.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList size={35} className="mx-auto mb-3" />

            <p>No leave requests found.</p>
          </div>
        )}

        {loading && (
          <p className="text-center py-6 text-gray-500">
            Loading requests...
          </p>
        )}

      </div>

      <div className="p-4 border-t flex justify-between items-center">

        <p className="text-sm text-gray-500">
          Showing {leaveRequests.length} of {pagination.count} requests
        </p>

        <div className="flex gap-2">

          <button
            disabled={!pagination.previous}
            onClick={() => fetchLeaveRequests(pagination.page - 1)}
            className="p-2 border rounded disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            disabled={!pagination.next}
            onClick={() => fetchLeaveRequests(pagination.page + 1)}
            className="p-2 border rounded disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>

        </div>

      </div>

    </div>
  );

  // =====================================================
  // LEAVE TYPES
  // =====================================================

  const LeaveTypes = () => (
    <div className="bg-white rounded-xl border shadow-sm">

      <div className="p-5 border-b flex justify-between items-center">

        <div>
          <h3 className="font-semibold text-gray-800">
            Leave Types
          </h3>

          <p className="text-sm text-gray-500">
            Configure the available leave categories.
          </p>
        </div>

        <button
          onClick={() => openModal("type")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Leave Type
        </button>

      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {leaveTypes.map((type) => (
          <div
            key={type.id}
            className="border rounded-xl p-5 hover:shadow-sm transition"
          >

            <div className="flex justify-between items-start">

              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <CalendarDays size={22} />
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  type.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {type.is_active ? "Active" : "Inactive"}
              </span>

            </div>

            <h4 className="font-semibold text-gray-800 mt-4">
              {type.name}
            </h4>

            <p className="text-sm text-gray-500 mt-2">
              {type.description || "No description provided."}
            </p>

            <div className="flex justify-between mt-5 pt-4 border-t">

              <div>
                <p className="text-xs text-gray-400">
                  Default Days
                </p>

                <p className="font-bold text-gray-800">
                  {type.default_days} days
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Payment
                </p>

                <p className="font-medium text-gray-700">
                  {type.is_paid ? "Paid" : "Unpaid"}
                </p>
              </div>

              <button
                onClick={() => openModal("type", type)}
                className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                title="Edit leave type"
              >
                <Edit size={18} />
              </button>

            </div>

          </div>
        ))}

      </div>

      {leaveTypes.length === 0 && (
        <p className="text-center py-10 text-gray-400">
          No leave types available.
        </p>
      )}

    </div>
  );

  // =====================================================
  // LEAVE BALANCES
  // =====================================================

  const LeaveBalances = () => (
    <div className="bg-white rounded-xl border shadow-sm">

      <div className="p-5 border-b flex justify-between items-center">

        <div>
          <h3 className="font-semibold text-gray-800">
            Employee Leave Balances
          </h3>

          <p className="text-sm text-gray-500">
            Track annual leave allocations and usage.
          </p>
        </div>

        <button
          onClick={() => openModal("balance")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Allocate Leave
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-left">

          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Leave Type</th>
              <th className="p-4">Year</th>
              <th className="p-4">Allocated</th>
              <th className="p-4">Used</th>
              <th className="p-4">Remaining</th>
              <th className="p-4">Usage</th>
            </tr>
          </thead>

          <tbody>

            {leaveBalances.map((balance) => {
              const allocated = Number(balance.allocated_days);
              const used = Number(balance.used_days);
              const remaining = Number(balance.remaining_days);

              const percentage = allocated > 0
                ? Math.min(100, (used / allocated) * 100)
                : 0;

              return (
                <tr key={balance.id} className="border-t">

                  <td className="p-4">
                    <p className="font-medium text-gray-800">
                      {balance.employee_name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {balance.employee_number}
                    </p>
                  </td>

                  <td className="p-4">
                    {balance.leave_type_name}
                  </td>

                  <td className="p-4">
                    {balance.year}
                  </td>

                  <td className="p-4">
                    {allocated}
                  </td>

                  <td className="p-4 text-amber-600 font-medium">
                    {used}
                  </td>

                  <td className="p-4 text-green-600 font-semibold">
                    {remaining}
                  </td>

                  <td className="p-4 min-w-32">

                    <div className="flex justify-between text-xs mb-1">
                      <span>{percentage.toFixed(0)}%</span>
                    </div>

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

        {leaveBalances.length === 0 && (
          <p className="text-center py-10 text-gray-400">
            No leave balances found.
          </p>
        )}

      </div>

    </div>
  );

  // =====================================================
  // REPORT FUNCTIONS
  // =====================================================

  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/leave_management/report/",
        {
          params: {
            year: filters.year,
            status: filters.status || undefined,
            department: filters.department || undefined,
            employee: filters.employee || undefined,
          },
        }
      );

      setReportData(response.data.results || []);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/leave_management/report/",
        {
          params: {
            year: filters.year,
            status: filters.status || undefined,
            department: filters.department || undefined,
            employee: filters.employee || undefined,
            export: "csv",
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "text/csv" })
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = `leave_report_${filters.year}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      showSuccess("Leave report exported successfully.");
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REPORT COMPONENT
  // =====================================================

  const Reports = () => (
    <div className="bg-white rounded-xl border shadow-sm">

      <div className="p-5 border-b flex flex-col md:flex-row justify-between gap-4">

        <div>
          <h3 className="font-semibold text-gray-800">
            Leave Reports
          </h3>

          <p className="text-sm text-gray-500">
            Review leave applications and export records.
          </p>
        </div>

        <button
          onClick={exportReport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Download size={18} />
          Export CSV
        </button>

      </div>

      <div className="p-5 flex flex-wrap gap-3">

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button
          onClick={fetchReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Generate Report
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-left">

          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Department</th>
              <th className="p-4">Leave Type</th>
              <th className="p-4">Start Date</th>
              <th className="p-4">End Date</th>
              <th className="p-4">Days</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>

            {reportData.map((row, index) => (
              <tr key={index} className="border-t">

                <td className="p-4">
                  <p className="font-medium">
                    {row.employee_name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {row.employee_number}
                  </p>
                </td>

                <td className="p-4">
                  {row.department}
                </td>

                <td className="p-4">
                  {row.leave_type}
                </td>

                <td className="p-4">
                  {formatDate(row.start_date)}
                </td>

                <td className="p-4">
                  {formatDate(row.end_date)}
                </td>

                <td className="p-4">
                  {row.days_requested}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(row.status)}`}
                  >
                    {row.status}
                  </span>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

        {reportData.length === 0 && (
          <p className="text-center py-10 text-gray-400">
            Generate a report to display records.
          </p>
        )}

      </div>

    </div>
  );

  // =====================================================
  // MODAL COMPONENT
  // =====================================================

  const Modal = () => {
    if (!modal.open) return null;

    const titles = {
      request: modal.data ? "Edit Leave Request" : "New Leave Request",
      type: modal.data ? "Edit Leave Type" : "Create Leave Type",
      balance: "Allocate Leave Balance",
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

        <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">

          <div className="p-5 border-b flex justify-between items-center">

            <h3 className="font-semibold text-gray-800">
              {titles[modal.type]}
            </h3>

            <button onClick={closeModal}>
              <X size={21} />
            </button>

          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {modal.type === "request" && (
              <>

                <div>
                  <label className="block text-sm mb-2">
                    Employee UUID
                  </label>

                  <input
                    name="employee"
                    value={formData.employee || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Employee UUID"
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Leave Type
                  </label>

                  <select
                    name="leave_type"
                    value={formData.leave_type || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg p-3"
                  >
                    <option value="">Select leave type</option>

                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="block text-sm mb-2">
                      Start Date
                    </label>

                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg p-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">
                      End Date
                    </label>

                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-lg p-3"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Days Requested
                  </label>

                  <input
                    type="number"
                    name="days_requested"
                    min="0.5"
                    step="0.5"
                    value={formData.days_requested || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Reason
                  </label>

                  <textarea
                    name="reason"
                    value={formData.reason || ""}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full border rounded-lg p-3"
                    placeholder="Explain the reason for leave..."
                  />
                </div>

              </>
            )}

            {modal.type === "type" && (
              <>

                <div>
                  <label className="block text-sm mb-2">
                    Leave Type Name
                  </label>

                  <input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Default Days
                  </label>

                  <input
                    type="number"
                    name="default_days"
                    min="0"
                    value={formData.default_days ?? 0}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <label className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    name="is_paid"
                    checked={!!formData.is_paid}
                    onChange={handleInputChange}
                  />
                  Paid Leave
                </label>

                <label className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={!!formData.is_active}
                    onChange={handleInputChange}
                  />
                  Active
                </label>

              </>
            )}

            {modal.type === "balance" && (
              <>

                <div>
                  <label className="block text-sm mb-2">
                    Employee UUID
                  </label>

                  <input
                    name="employee"
                    value={formData.employee || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Employee UUID"
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Leave Type
                  </label>

                  <select
                    name="leave_type"
                    value={formData.leave_type || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg p-3"
                  >
                    <option value="">Select leave type</option>

                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Year
                  </label>

                  <input
                    type="number"
                    name="year"
                    value={formData.year || currentYear}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Allocated Days
                  </label>

                  <input
                    type="number"
                    name="allocated_days"
                    min="0"
                    step="0.5"
                    value={formData.allocated_days || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg p-3"
                  />
                </div>

              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">

              <button
                type="button"
                onClick={closeModal}
                className="border px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>

            </div>

          </form>

        </div>

      </div>
    );
  };

  // =====================================================
  // VIEW AND REVIEW REQUEST
  // =====================================================

  const RequestDetails = () => {
    if (!selectedRequest) return null;

    const request = selectedRequest;

    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

        <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">

          <div className="p-5 border-b flex justify-between">
            <h3 className="font-semibold">
              Leave Request Details
            </h3>

            <button onClick={() => setSelectedRequest(null)}>
              <X />
            </button>
          </div>

          <div className="p-5 space-y-4">

            <div className="grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-gray-400">Employee</p>
                <p className="font-medium">{request.employee_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Employee Number</p>
                <p className="font-medium">{request.employee_number}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Leave Type</p>
                <p className="font-medium">{request.leave_type_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Days Requested</p>
                <p className="font-medium">{request.days_requested}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Start Date</p>
                <p>{formatDate(request.start_date)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">End Date</p>
                <p>{formatDate(request.end_date)}</p>
              </div>

            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Reason</p>

              <p className="bg-gray-50 p-3 rounded-lg text-sm">
                {request.reason}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>

              <span className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(request.status)}`}>
                {request.status}
              </span>
            </div>

            {request.status === "PENDING" && (
              <>
                <div>
                  <label className="text-sm font-medium">
                    Review Comment
                  </label>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows="3"
                    placeholder="Enter a review comment or rejection reason..."
                    className="w-full border rounded-lg p-3 mt-2"
                  />
                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={() => approveRequest(request.id)}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => rejectRequest(request.id)}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg"
                  >
                    Reject
                  </button>

                </div>
              </>
            )}

            {request.review_comment && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400">
                  Review Comment
                </p>

                <p className="text-sm mt-1">
                  {request.review_comment}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    );
  };

  // =====================================================
  // MAIN COMPONENT LAYOUT
  // =====================================================

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      id: "requests",
      label: "Leave Requests",
      icon: ClipboardList,
    },
    {
      id: "types",
      label: "Leave Types",
      icon: CalendarDays,
    },
    {
      id: "balances",
      label: "Leave Balances",
      icon: Wallet,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;

      case "requests":
        return <Requests />;

      case "types":
        return <LeaveTypes />;

      case "balances":
        return <LeaveBalances />;

      case "reports":
        return <Reports />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* PAGE HEADER */}

      <div className="bg-white border-b px-5 lg:px-8 py-5">

        <div className="flex flex-col md:flex-row justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Leave Management
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage employee leave applications, approvals and balances.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <select
              value={filters.year}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  year: Number(e.target.value),
                }))
              }
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              onClick={refreshData}
              className="border rounded-lg p-2 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

          </div>

        </div>

      </div>

      {/* NOTIFICATIONS */}

      <div className="px-5 lg:px-8 pt-4 space-y-2">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm">{error}</span>

            <button onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm">{success}</span>

            <button onClick={() => setSuccess("")}>
              <X size={18} />
            </button>
          </div>
        )}

      </div>

      {/* NAVIGATION */}

      <div className="px-5 lg:px-8 pt-5">

        <div className="bg-white rounded-xl border p-2 flex gap-2 overflow-x-auto">

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm whitespace-nowrap transition ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />

                {item.label}
              </button>
            );
          })}

        </div>

      </div>

      {/* MAIN CONTENT */}

      <main className="p-5 lg:p-8">

        {loading && (
          <div className="mb-4 text-sm text-blue-600">
            Processing...
          </div>
        )}

        {renderContent()}

      </main>

      {/* MODALS */}

      <Modal />

      <RequestDetails />

    </div>
  );
};

export default LeaveManagement;
