
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Users,
  BriefcaseBusiness,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  LayoutDashboard,
  Filter,
} from "lucide-react";

import api from "./context/api/api";

// API configuration
const API_URL = "departments/";


const Departments = () => {
  // Department data
  const [departments, setDepartments] = useState([]);

  // Dashboard statistics
  const [stats, setStats] = useState({
    total_departments: 0,
    active_departments: 0,
    inactive_departments: 0,
    empty_departments: 0,
    total_headcount: 0,
    average_headcount: 0,
    largest_department: null,
  });

  // Loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const confirmDelete = (department) => {
    setDepartmentToDelete(department);
    setShowDeleteModal(true);
    };

  // Notification
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });

  // Helper for notifications
  const notify = (type, message) => {
    setNotification({ type, message });

    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

  // Extract readable API error
  const getErrorMessage = (err) => {
    const data = err.response?.data;

    if (!data) return "Something went wrong. Please try again.";

    if (typeof data === "string") return data;

    if (data.error) return data.error;

    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "object"
            ? JSON.stringify(value)
            : value;

        return `${key}: ${message}`;
      })
      .join(" | ");
  };

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: currentPage,
        search: search.trim() || undefined,
        is_active:
          statusFilter === "all"
            ? undefined
            : statusFilter === "active"
              ? true
              : false,
      };

      const response = await api.get(API_URL, { params });

      const data = response.data;

      setDepartments(data.results || []);
      setNextPage(data.next || null);
      setPreviousPage(data.previous || null);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get(`${API_URL}stats/`);
      setStats(response.data);
    } catch (err) {
      console.error("Statistics loading failed:", err);
    }
  }, []);

  // Load data on page load and filter changes
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Refresh everything
  const refreshData = () => {
    fetchDepartments();
    fetchStats();
  };

  // Open add department modal
  const openAddModal = () => {
    setEditingDepartment(null);

    setFormData({
      name: "",
      code: "",
      description: "",
      is_active: true,
    });

    setShowModal(true);
  };

  // Open edit department modal
  const openEditModal = (department) => {
    setEditingDepartment(department);

    setFormData({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      is_active: department.is_active,
    });

    setShowModal(true);
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Create or update department
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (editingDepartment) {
        await api.patch(
          `${API_URL}${editingDepartment.id}/`,
          formData
        );

        notify("success", "Department updated successfully.");
      } else {
        await api.post(API_URL, formData);

        notify("success", "Department created successfully.");
      }

      setShowModal(false);

      refreshData();
    } catch (err) {
      notify("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // View department details
  const viewDepartment = async (department) => {
    try {
      const response = await api.get(
        `${API_URL}${department.id}/`
      );

      setSelectedDepartment(response.data);
      setShowDetails(true);
    } catch (err) {
      notify("error", getErrorMessage(err));
    }
  };

  // Delete department
  const deleteDepartment = async () => {
  if (!departmentToDelete) return;

  try {
    setDeleting(true);

    await api.delete(
      `${API_URL}${departmentToDelete.id}/`
    );

    notify("success", "Department deleted successfully.");

    setShowDeleteModal(false);
    setDepartmentToDelete(null);

    refreshData();

  } catch (err) {
    notify("error", getErrorMessage(err));
  } finally {
    setDeleting(false);
  }
};
  // Export departments to CSV
  const exportDepartments = async () => {
    try {
      const response = await api.get(API_URL, {
        params: {
          export: "csv",
          search: search.trim() || undefined,
          is_active:
            statusFilter === "all"
              ? undefined
              : statusFilter === "active",
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = "departments.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      notify("success", "Departments exported successfully.");
    } catch (err) {
      notify("error", "Unable to export departments.");
    }
  };
  
  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {value ?? 0}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>

        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  const statisticsCards = [
    {
      title: "Total Departments",
      value: stats.total_departments,
      icon: Building2,
      color: "bg-blue-100 text-blue-600",
      description: "Registered departments",
    },
    {
      title: "Active Departments",
      value: stats.active_departments,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      description: "Operational departments",
    },
    {
      title: "Inactive Departments",
      value: stats.inactive_departments,
      icon: XCircle,
      color: "bg-red-100 text-red-600",
      description: "Disabled departments",
    },
    {
      title: "Total Employees",
      value: stats.total_headcount,
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      description: "Current headcount",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 rounded-lg px-5 py-4 shadow-lg text-white ${
          notification.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {notification.type === "success"
            ? <CheckCircle size={20} />
            : <AlertCircle size={20} />
          }

          <span className="text-sm font-medium">
            {notification.message}
          </span>

          <button onClick={() => setNotification(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <LayoutDashboard size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Human Resource Management
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Departments
          </h1>

          <p className="text-gray-500 mt-2">
            Manage organizational departments, staff and positions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-gray-700"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={exportDepartments}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-gray-700"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            <Plus size={18} />
            Add Department
          </button>

        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statisticsCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Additional statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Empty Departments</p>
          <h3 className="text-2xl font-bold mt-2">
            {stats.empty_departments}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Active departments without employees
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Average Headcount</p>
          <h3 className="text-2xl font-bold mt-2">
            {stats.average_headcount}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Average employees per active department
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Largest Department</p>
          <h3 className="text-xl font-bold mt-2">
            {stats.largest_department || "N/A"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Department with highest headcount
          </p>
        </div>

      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-gray-400"
              size={19}
            />

            <input
              type="text"
              placeholder="Search department name, code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">

            <Filter size={18} className="text-gray-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

          </div>

        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            Showing {departments.length} of {totalCount} departments
          </span>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>

      </div>

      {/* Departments table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Department Directory
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all registered departments.
            </p>
          </div>

          <Building2 className="text-blue-600" size={24} />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="animate-spin mx-auto text-blue-600" size={32} />
            <p className="text-gray-500 mt-3">Loading departments...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <AlertCircle className="mx-auto text-red-500" size={35} />
            <p className="text-red-600 mt-3">{error}</p>

            <button
              onClick={refreshData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : departments.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="mx-auto text-gray-300" size={45} />
            <h3 className="font-semibold text-gray-700 mt-4">
              No departments found
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Create a department or change your search filters.
            </p>

            <button
              onClick={openAddModal}
              className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              Add Department
            </button>
          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Employees</th>
                  <th className="px-6 py-4">Positions</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {departments.map((department) => (

                  <tr
                    key={department.id}
                    className="hover:bg-gray-50 transition"
                  >

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Building2 size={20} />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {department.name}
                          </p>

                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {department.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 rounded-md font-mono text-gray-700">
                        {department.code}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {department.employee_count ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      {department.position_count ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      {department.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <CheckCircle size={13} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          <XCircle size={13} />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() => viewDepartment(department)}
                          title="View department"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => openEditModal(department)}
                          title="Edit department"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => confirmDelete(department)}
                          title="Delete department"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>
                    </td>

                  </tr>

                ))}

              </tbody>
            </table>

          </div>
        )}

        {/* Pagination */}
        {!loading && departments.length > 0 && (
          <div className="px-5 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">

            <p className="text-sm text-gray-500">
              Total records: {totalCount}
            </p>

            <div className="flex items-center gap-3">

              <button
                disabled={!previousPage}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage}
              </span>

              <button
                disabled={!nextPage}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
                <ChevronRight size={17} />
              </button>

            </div>
          </div>
        )}

      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">

            <div className="flex justify-between items-center p-6 border-b">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingDepartment ? "Edit Department" : "Add Department"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingDepartment
                    ? "Update department information."
                    : "Enter details to create a new department."}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>

                <input
                  type="text"
                  name="name"
                  required
                  maxLength={150}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Human Resources"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code *
                </label>

                <input
                  type="text"
                  name="code"
                  required
                  maxLength={30}
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. HR"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Letters, numbers, hyphens and underscores only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the department..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-600"
                />

                <span className="text-sm text-gray-700 font-medium">
                  Department is active
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingDepartment
                      ? "Update Department"
                      : "Create Department"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Department details */}
      {showDetails && selectedDepartment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-6 border-b">

              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Building2 size={25} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    {selectedDepartment.name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    Department details
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-6 space-y-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Department Code</p>
                  <p className="font-semibold mt-2">
                    {selectedDepartment.code}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Status</p>

                  <p className="font-semibold mt-2">
                    {selectedDepartment.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Employees</p>
                  <p className="font-semibold mt-2">
                    {selectedDepartment.employee_count ?? 0}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Positions</p>
                  <p className="font-semibold mt-2">
                    {selectedDepartment.position_count ?? 0}
                  </p>
                </div>

              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>

                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {selectedDepartment.description || "No description provided."}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Department Positions
                </h3>

                {selectedDepartment.positions?.length > 0 ? (

                  <div className="space-y-3">

                    {selectedDepartment.positions.map((position) => (

                      <div
                        key={position.id}
                        className="border rounded-lg p-4 flex justify-between items-center"
                      >

                        <div>
                          <p className="font-semibold text-gray-800">
                            {position.title}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Code: {position.code}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            {position.employee_count ?? 0}
                          </p>

                          <p className="text-xs text-gray-500">
                            Employees
                          </p>
                        </div>

                      </div>

                    ))}

                  </div>

                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                    No positions have been created for this department.
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-400 border-t pt-4">
                Created: {selectedDepartment.created_at
                  ? new Date(selectedDepartment.created_at).toLocaleDateString()
                  : "N/A"}
              </div>

            </div>

            <div className="p-5 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowDetails(false);
                  openEditModal(selectedDepartment);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Pencil size={16} className="inline mr-2" />
                Edit Department
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteModal && departmentToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <Trash2 size={24} />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                Delete Department
              </h2>
            </div>

            <p className="text-gray-600 text-sm leading-6">
              Are you sure you want to delete{" "}
              <strong>{departmentToDelete.name}</strong>?
              This action cannot be undone.
            </p>

            <p className="text-xs text-red-500 mt-3">
              Departments with employee or position records cannot be deleted.
              Deactivate them instead.
            </p>

            <div className="flex justify-end gap-3 mt-7">

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDepartmentToDelete(null);
                }}
                disabled={deleting}
                className="px-5 py-2.5 border rounded-lg text-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={deleteDepartment}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Department"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Departments;

