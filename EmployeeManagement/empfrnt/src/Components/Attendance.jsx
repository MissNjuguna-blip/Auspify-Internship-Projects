
import React, { useCallback, useEffect, useMemo, useState } from "react";
// import api from "../api";
import {
  CalendarDays,
  Clock,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  Search,
  Plus,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Filter,
  ClipboardList,
} from "lucide-react";
import api from "./context/api/api";

const Attendance = () => {
  // =====================================================
  // CONFIGURATION
  // =====================================================

  const API_URL = "attendance/";

  const STATUS_OPTIONS = [
    { value: "PRESENT", label: "Present" },
    { value: "ABSENT", label: "Absent" },
    { value: "LATE", label: "Late" },
    { value: "HALF_DAY", label: "Half Day" },
    { value: "ON_LEAVE", label: "On Leave" },
  ];

  const EMPTY_FORM = {
    employee: "",
    attendance_date: new Date().toISOString().split("T")[0],
    check_in: "",
    check_out: "",
    status: "PRESENT",
    remarks: "",
  };

  // =====================================================
  // STATE
  // =====================================================

  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [report, setReport] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("daily");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("PRESENT");

  const [actionEmployee, setActionEmployee] = useState("");
  const [actionRemarks, setActionRemarks] = useState("");

  // =====================================================
  // HELPERS
  // =====================================================

  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (typeof data === "string") return data;
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;

    if (data && typeof data === "object") {
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
    }

    return err?.message || "Something went wrong.";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString();
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return "—";

    return new Date(dateTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "—";

    return `${Number(hours).toFixed(2)} hrs`;
  };

  const getEmployeeName = (employee) => {
    return (
      employee?.full_name ||
      `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim()
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      PRESENT: "bg-green-100 text-green-700",
      ABSENT: "bg-red-100 text-red-700",
      LATE: "bg-orange-100 text-orange-700",
      HALF_DAY: "bg-yellow-100 text-yellow-700",
      ON_LEAVE: "bg-blue-100 text-blue-700",
    };

    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status) => {
    return (
      STATUS_OPTIONS.find((item) => item.value === status)?.label ||
      status ||
      "Unknown"
    );
  };

  const getEmployeeId = (employee) => employee?.id || employee?.pk;

  // =====================================================
  // END SECTION 1
  // =====================================================

  // =====================================================
  // FETCH EMPLOYEES
  // =====================================================

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/employees/", {
        params: { page_size: 200 },
      });

      const data = response.data;

      setEmployees(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      console.error("Employee fetch error:", err);
    }
  }, []);

  // =====================================================
  // FETCH DEPARTMENTS
  // =====================================================

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments/", {
        params: { page_size: 200 },
      });

      const data = response.data;

      setDepartments(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      console.error("Department fetch error:", err);
    }
  }, []);

  // =====================================================
  // FETCH ATTENDANCE RECORDS
  // =====================================================

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        page_size: pageSize,
        date: selectedDate,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.department = departmentFilter;

      const response = await api.get(API_URL, { params });

      const data = response.data;

      setAttendance(
        Array.isArray(data) ? data : data.results || []
      );

      setTotalPages(
        Math.max(
          1,
          Math.ceil((data.count || 0) / pageSize)
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    selectedDate,
    search,
    statusFilter,
    departmentFilter,
  ]);

  // =====================================================
  // FETCH DAILY SUMMARY
  // =====================================================

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get(
        `${API_URL}summary/`,
        {
          params: { date: selectedDate },
        }
      );

      setSummary(response.data);
    } catch (err) {
      console.error("Summary fetch error:", err);
    }
  }, [selectedDate]);

  // =====================================================
  // FETCH MONTHLY REPORT
  // =====================================================

  const fetchReport = useCallback(async () => {
    try {
      const response = await api.get(
        `${API_URL}report/`,
        {
          params: { month: selectedMonth },
        }
      );

      const data = response.data;

      setReport(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      console.error("Report fetch error:", err);
    }
  }, [selectedMonth]);

  // =====================================================
  // INITIAL DATA
  // =====================================================

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [fetchEmployees, fetchDepartments]);

  useEffect(() => {
    fetchAttendance();
    fetchSummary();
  }, [fetchAttendance, fetchSummary]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReport();
    }
  }, [activeTab, fetchReport]);

  // =====================================================
  // REFRESH ALL
  // =====================================================

  const refreshData = () => {
    fetchAttendance();
    fetchSummary();

    if (activeTab === "reports") {
      fetchReport();
    }
  };

  // =====================================================
  // END SECTION 2
  // =====================================================

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);

    setFormData({
      employee: record.employee,
      attendance_date: record.attendance_date,
      check_in: record.check_in
        ? record.check_in.slice(0, 16)
        : "",
      check_out: record.check_out
        ? record.check_out.slice(0, 16)
        : "",
      status: record.status,
      remarks: record.remarks || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setFormData(EMPTY_FORM);
  };

  // =====================================================
  // CREATE / UPDATE ATTENDANCE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        employee: formData.employee,
        check_in: formData.check_in
          ? new Date(formData.check_in).toISOString()
          : null,
        check_out: formData.check_out
          ? new Date(formData.check_out).toISOString()
          : null,
      };

      if (editingRecord) {
        await api.patch(
          `${API_URL}${editingRecord.id}/`,
          payload
        );
      } else {
        await api.post(API_URL, payload);
      }

      closeModal();
      refreshData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE ATTENDANCE
  // =====================================================

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete attendance record for ${record.employee_name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`${API_URL}${record.id}/`);

      refreshData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // =====================================================
  // CHECK-IN
  // =====================================================

  const handleCheckIn = async () => {
    if (!actionEmployee) {
      setError("Please select an employee.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post(`${API_URL}check-in/`, {
        employee: actionEmployee,
        remarks: actionRemarks,
      });

      setActionEmployee("");
      setActionRemarks("");

      refreshData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CHECK-OUT
  // =====================================================

  const handleCheckOut = async () => {
    if (!actionEmployee) {
      setError("Please select an employee.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post(`${API_URL}check-out/`, {
        employee: actionEmployee,
        remarks: actionRemarks,
      });

      setActionEmployee("");
      setActionRemarks("");

      refreshData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // BULK ATTENDANCE
  // =====================================================

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    const activeEmployees = employees
      .filter((employee) =>
        ["ACTIVE", "ON_LEAVE"].includes(employee.employment_status)
      )
      .map(getEmployeeId);

    setSelectedEmployees(activeEmployees);
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const handleBulkMark = async () => {
    if (!selectedEmployees.length) {
      setError("Select at least one employee.");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedEmployees.length} employees as ${getStatusLabel(bulkStatus)}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await api.post(`${API_URL}bulk/`, {
        attendance_date: selectedDate,
        records: selectedEmployees.map((id) => ({
          employee: id,
          status: bulkStatus,
        })),
      });

      setSelectedEmployees([]);
      refreshData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // END SECTION 3
  // =====================================================

  // =====================================================
  // EXPORT CSV
  // =====================================================

  const exportReport = async () => {
    try {
      const response = await api.get(
        `${API_URL}report/`,
        {
          params: {
            month: selectedMonth,
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
      link.download = `attendance_report_${selectedMonth}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // =====================================================
  // SUMMARY VALUES
  // =====================================================

  const stats = useMemo(() => {
    return [
      {
        title: "Expected Employees",
        value: summary?.expected_employees ?? 0,
        icon: Users,
        color: "bg-blue-100 text-blue-600",
      },
      {
        title: "Present",
        value: summary?.present ?? 0,
        icon: UserCheck,
        color: "bg-green-100 text-green-600",
      },
      {
        title: "Absent",
        value: summary?.absent ?? 0,
        icon: UserX,
        color: "bg-red-100 text-red-600",
      },
      {
        title: "Late",
        value: summary?.late ?? 0,
        icon: Clock,
        color: "bg-orange-100 text-orange-600",
      },
      {
        title: "On Leave",
        value: summary?.on_leave ?? 0,
        icon: CalendarDays,
        color: "bg-purple-100 text-purple-600",
      },
      {
        title: "Not Marked",
        value: summary?.not_marked ?? 0,
        icon: AlertCircle,
        color: "bg-gray-100 text-gray-600",
      },
    ];
  }, [summary]);

  // =====================================================
  // ACTIVE EMPLOYEES
  // =====================================================

  const activeEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        ["ACTIVE", "ON_LEAVE"].includes(employee.employment_status)
      ),
    [employees]
  );

  // =====================================================
  // REUSABLE STAT CARD
  // =====================================================

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
            {value}
          </h3>
        </div>

        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const StatusBadge = ({ status }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );

  // =====================================================
  // END SECTION 4
  // =====================================================

  // =====================================================
  // MAIN COMPONENT UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">

      {/* PAGE HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Attendance Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Monitor employee attendance, check-ins and attendance reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Attendance
          </button>

        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between gap-3">
          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* DATE SELECTOR */}

      <div className="bg-white border rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div className="flex items-center gap-2">
          <CalendarDays className="text-blue-600" size={20} />

          <span className="font-semibold text-gray-700">
            Attendance Date
          </span>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">

        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}

      </div>

      {/* ATTENDANCE RATE */}

      <div className="bg-white border rounded-xl p-5 mb-7">

        <div className="flex justify-between items-center mb-3">

          <div>
            <h3 className="font-semibold text-gray-800">
              Daily Attendance Rate
            </h3>

            <p className="text-sm text-gray-500">
              Percentage of employees who attended work.
            </p>
          </div>

          <span className="text-xl font-bold text-blue-600">
            {summary?.attendance_rate ?? 0}%
          </span>

        </div>

        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">

          <div
            className="bg-blue-600 h-full rounded-full transition-all"
            style={{
              width: `${Math.min(summary?.attendance_rate || 0, 100)}%`,
            }}
          />

        </div>

      </div>

      {/* TABS */}

      <div className="flex gap-2 border-b mb-6 overflow-x-auto">

        {[
          { id: "daily", label: "Daily Attendance" },
          { id: "bulk", label: "Bulk Marking" },
          { id: "actions", label: "Check In / Out" },
          { id: "reports", label: "Monthly Reports" },
        ].map((tab) => (

          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 whitespace-nowrap text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>

        ))}

      </div>

      {/* END SECTION 5 */}

      {/* DAILY ATTENDANCE TAB */}

      {activeTab === "daily" && (

        <div className="bg-white border rounded-xl overflow-hidden">

          {/* SEARCH AND FILTERS */}

          <div className="p-4 border-b flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

            <div className="relative flex-1 max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div className="flex flex-wrap gap-2">

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Statuses</option>

                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}

              </select>

              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Departments</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}

              </select>

            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">

                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Check In</th>
                  <th className="px-5 py-4">Check Out</th>
                  <th className="px-5 py-4">Hours</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>

              </thead>

              <tbody className="divide-y">

                {loading ? (

                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      Loading attendance records...
                    </td>
                  </tr>

                ) : attendance.length === 0 ? (

                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      No attendance records found.
                    </td>
                  </tr>

                ) : (

                  attendance.map((record) => (

                    <tr key={record.id} className="hover:bg-gray-50">

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800">
                          {record.employee_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {record.employee_number}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {record.department || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(record.attendance_date)}
                      </td>

                      <td className="px-5 py-4">
                        {formatTime(record.check_in)}
                      </td>

                      <td className="px-5 py-4">
                        {formatTime(record.check_out)}
                      </td>

                      <td className="px-5 py-4">
                        {formatHours(record.hours_worked)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={record.status} />
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() => openEditModal(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(record)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          <div className="p-4 border-t flex justify-between items-center">

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-2">

              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="p-2 border rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="p-2 border rounded-lg disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>

            </div>

          </div>

        </div>

      )}

      {/* BULK ATTENDANCE TAB */}

      {activeTab === "bulk" && (

        <div className="bg-white border rounded-xl p-5">

          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-5">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Bulk Attendance Marking
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Select employees and assign their attendance status.
              </p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={selectAllEmployees}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                Select All
              </button>

              <button
                onClick={clearSelection}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                Clear
              </button>

            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">

            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >

              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}

            </select>

            <button
              onClick={handleBulkMark}
              disabled={saving || selectedEmployees.length === 0}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : `Save ${selectedEmployees.length} Records`}
            </button>

          </div>

          <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">

            {activeEmployees.map((employee) => {

              const employeeId = getEmployeeId(employee);

              return (

                <label
                  key={employeeId}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                >

                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employeeId)}
                    onChange={() => toggleEmployee(employeeId)}
                    className="w-4 h-4"
                  />

                  <div className="flex-1">

                    <p className="font-medium text-gray-800">
                      {getEmployeeName(employee)}
                    </p>

                    <p className="text-xs text-gray-500">
                      {employee.employee_number} · {employee.department_name || employee.department?.name || "No department"}
                    </p>

                  </div>

                  <span className="text-xs text-gray-500">
                    {employee.employment_status}
                  </span>

                </label>

              );

            })}

            {activeEmployees.length === 0 && (
              <p className="text-center text-gray-500 py-10">
                No eligible employees found.
              </p>
            )}

          </div>

        </div>

      )}

      {/* CHECK-IN / CHECK-OUT TAB */}

      {activeTab === "actions" && (

        <div className="bg-white border rounded-xl p-6 max-w-2xl">

          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Employee Check-In / Check-Out
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            Record an employee's arrival or departure.
          </p>

          <div className="space-y-4">

            <div>

              <label className="block text-sm font-medium mb-2">
                Select Employee
              </label>

              <select
                value={actionEmployee}
                onChange={(e) => setActionEmployee(e.target.value)}
                className="w-full border rounded-lg px-3 py-3"
              >

                <option value="">Choose Employee</option>

                {activeEmployees.map((employee) => (

                  <option
                    key={getEmployeeId(employee)}
                    value={getEmployeeId(employee)}
                  >
                    {employee.employee_number} - {getEmployeeName(employee)}
                  </option>

                ))}

              </select>

            </div>

            <div>

              <label className="block text-sm font-medium mb-2">
                Remarks (Optional)
              </label>

              <textarea
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows="3"
                className="w-full border rounded-lg p-3"
                placeholder="Enter remarks..."
              />

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={handleCheckIn}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                <LogIn size={18} />
                Check In
              </button>

              <button
                onClick={handleCheckOut}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 bg-orange-600 text-white rounded-lg disabled:opacity-50"
              >
                <LogOut size={18} />
                Check Out
              </button>

            </div>

          </div>

        </div>

      )}

      {/* END SECTION 6 */}

      {/* MONTHLY REPORTS TAB */}

      {activeTab === "reports" && (

        <div className="bg-white border rounded-xl overflow-hidden">

          <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                Monthly Attendance Report
              </h2>

              <p className="text-sm text-gray-500">
                Review employee attendance performance.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />

              <button
                onClick={fetchReport}
                className="px-4 py-2 border rounded-lg flex items-center gap-2"
              >
                <Filter size={16} />
                Filter
              </button>

              <button
                onClick={exportReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">

                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Records</th>
                  <th className="px-5 py-4">Present</th>
                  <th className="px-5 py-4">Late</th>
                  <th className="px-5 py-4">Half Day</th>
                  <th className="px-5 py-4">Absent</th>
                  <th className="px-5 py-4">On Leave</th>
                  <th className="px-5 py-4">Hours</th>
                  <th className="px-5 py-4">Rate</th>
                </tr>

              </thead>

              <tbody className="divide-y">

                {report.length === 0 ? (

                  <tr>
                    <td colSpan="10" className="text-center py-12 text-gray-500">
                      No monthly report data available.
                    </td>
                  </tr>

                ) : (

                  report.map((item) => (

                    <tr key={item.employee_id} className="hover:bg-gray-50">

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {item.employee_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.employee_number}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {item.department || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {item.records}
                      </td>

                      <td className="px-5 py-4 text-green-600 font-medium">
                        {item.present}
                      </td>

                      <td className="px-5 py-4 text-orange-600">
                        {item.late}
                      </td>

                      <td className="px-5 py-4">
                        {item.half_day}
                      </td>

                      <td className="px-5 py-4 text-red-600">
                        {item.absent}
                      </td>

                      <td className="px-5 py-4">
                        {item.on_leave}
                      </td>

                      <td className="px-5 py-4">
                        {formatHours(item.hours_worked)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-blue-600">
                        {item.attendance_rate}%
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* ADD / EDIT ATTENDANCE MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingRecord ? "Edit Attendance" : "Add Attendance"}
                </h2>

                <p className="text-sm text-gray-500">
                  Enter the attendance information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* EMPLOYEE */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Employee *
                </label>

                <select
                  name="employee"
                  value={formData.employee}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingRecord}
                  className="w-full border rounded-lg px-3 py-3 disabled:bg-gray-100"
                >

                  <option value="">Select Employee</option>

                  {employees
                    .filter((employee) =>
                      ["ACTIVE", "ON_LEAVE"].includes(employee.employment_status)
                    )
                    .map((employee) => (

                      <option
                        key={getEmployeeId(employee)}
                        value={getEmployeeId(employee)}
                      >
                        {employee.employee_number} - {getEmployeeName(employee)}
                      </option>

                    ))}

                </select>

              </div>

              {/* DATE */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Attendance Date *
                </label>

                <input
                  type="date"
                  name="attendance_date"
                  value={formData.attendance_date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full border rounded-lg px-3 py-3"
                />

              </div>

              {/* CHECK IN / OUT */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Check In
                  </label>

                  <input
                    type="datetime-local"
                    name="check_in"
                    value={formData.check_in}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Check Out
                  </label>

                  <input
                    type="datetime-local"
                    name="check_out"
                    value={formData.check_out}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-3"
                  />

                </div>

              </div>

              {/* STATUS */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Attendance Status *
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded-lg px-3 py-3"
                >

                  {STATUS_OPTIONS.map((status) => (

                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>

                  ))}

                </select>

              </div>

              {/* REMARKS */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border rounded-lg p-3"
                  placeholder="Additional attendance notes..."
                />

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Update Attendance"
                      : "Save Attendance"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Attendance;
