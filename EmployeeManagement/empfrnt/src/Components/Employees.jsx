import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserMinus,
  CalendarDays,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import api from "./context/api/api";

const Employees = () => {
  // ==========================================
  // EMPLOYEE STATE
  // ==========================================

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FILTER STATE
  // ==========================================

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // ==========================================
  // PAGINATION
  // ==========================================

  const [page, setPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const pageSize = 10;

  const totalPages = Math.ceil(totalEmployees / pageSize);

  // ==========================================
  // MODAL STATE
  // ==========================================

  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // ==========================================
  // FORM DATA
  // ==========================================

  const initialForm = {
    employee_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    gender: "",
    date_of_birth: "",
    national_id: "",
    address: "",
    department: "",
    date_joined: "",
    employment_status: "ACTIVE",
    profile_photo: null,
  };

  const [formData, setFormData] = useState(initialForm);

  const [photoPreview, setPhotoPreview] = useState("");

  const photoObjectUrl = useRef(null);

  // ==========================================
  // DROPDOWN DATA
  // ==========================================

  const [departments, setDepartments] = useState([]);

  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const getErrorMessage = (err) => {
    const data = err.response?.data;

    if (!data) {
      return err.message || "Something went wrong. Please try again.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    if (data.error) {
      return data.error;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, messages]) => {
          const message = Array.isArray(messages)
            ? messages.join(", ")
            : typeof messages === "object" && messages !== null
              ? JSON.stringify(messages)
              : messages;

          return `${field.replaceAll("_", " ")}: ${message}`;
        })
        .join("\n");
    }

    return "Something went wrong. Please try again.";
  };

  // ==========================================
  // PHOTO CLEANUP
  // ==========================================

  const clearPhotoPreview = () => {
    if (photoObjectUrl.current) {
      URL.revokeObjectURL(photoObjectUrl.current);
      photoObjectUrl.current = null;
    }

    setPhotoPreview("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    clearPhotoPreview();
    setFormData({ ...initialForm });
    setSelectedEmployee(null);
  };

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("employees/", {
        params: {
          search: search.trim(),
          status,
          page,
          page_size: pageSize,
        },
      });

      const data = response.data;

      setEmployees(
        Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []
      );

      setTotalEmployees(data.count || data.length || 0);

    } catch (err) {
      setError(getErrorMessage(err));
      setEmployees([]);
      setTotalEmployees(0);

    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ==========================================
  // FETCH DEPARTMENTS
  // ==========================================

  const fetchDepartments = async () => {
    try {
      setDropdownLoading(true);

      const response = await api.get("departments/");

      const data = response.data.results || response.data;

      setDepartments(
        Array.isArray(data) ? data : []
      );

    } catch (err) {
      console.error("Department loading failed:", err);
      setDepartments();

    } finally {
      setDropdownLoading(false);
    }
  };

  // ==========================================
  // LOAD DROPDOWNS
  // ==========================================

  const loadDropdowns = async () => {
    await fetchDepartments();
  };

  // ==========================================
  // FORM INPUT HANDLER
  // ==========================================

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profile_photo" && files?.[0]) {
      const file = files[0];

      if (file.size > 5 * 1024 * 1024) {
        setError("Profile photo must not exceed 5MB.");
        e.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        e.target.value = "";
        return;
      }

      clearMessages();

      if (photoObjectUrl.current) {
        URL.revokeObjectURL(photoObjectUrl.current);
      }

      const previewUrl = URL.createObjectURL(file);

      photoObjectUrl.current = previewUrl;

      setPhotoPreview(previewUrl);

      setFormData(prev => ({
        ...prev,
        profile_photo: file,
      }));

      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // DEPARTMENT CHANGE
  // ==========================================

  const handleDepartmentChange = async (e) => {
    const departmentId = e.target.value;

    setFormData(prev => ({
      ...prev,
      department: departmentId,
    }));
  };

  // ==========================================
  // OPEN ADD EMPLOYEE MODAL
  // ==========================================

  const openAddModal = async () => {
    clearMessages();
    resetForm();
    setShowModal(true);
    await loadDropdowns();
  };

  // ==========================================
  // OPEN EDIT EMPLOYEE MODAL
  // ==========================================

  const openEditModal = async (employee) => {
    try {
      clearMessages();
      setSaving(true);

      const response = await api.get(
        `employees/${employee.id}/`
      );

      const data = response.data;

      clearPhotoPreview();

      setSelectedEmployee(data);

      setFormData({
        employee_number: data.employee_number || "",
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        gender: data.gender || "",
        date_of_birth: data.date_of_birth || "",
        national_id: data.national_id || "",
        address: data.address || "",
        department: data.department || "",
        date_joined: data.date_joined || "",
        employment_status: data.employment_status || "ACTIVE",
        profile_photo: null,
      });

      setPhotoPreview(data.profile_photo || "");
      setShowModal(true);
      await loadDropdowns();

    } catch (err) {
      setError(getErrorMessage(err));

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CLOSE EMPLOYEE MODAL
  // ==========================================

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    clearMessages();
  };

  // ==========================================
  // SAVE EMPLOYEE
  // ADD OR UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      clearMessages();

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          return;
        }

        if (key === "profile_photo") {
          if (value instanceof File) {
            payload.append(key, value);
          }
          return;
        }

        if (
          key === "employee_number" &&
          !String(value).trim()
        ) {
          return;
        }

        if (
          key === "middle_name" &&
          !String(value).trim()
        ) {
          payload.append(key, "");
          return;
        }

        payload.append(key, value);
      });

      if (selectedEmployee) {
        // Updated to use PATCH with UUID endpoint
        await api.patch(
          `employees/${selectedEmployee.id}/`,
          payload
        );

        setSuccess("Employee updated successfully!");

      } else {
        await api.post(
          "employees/",
          payload
        );

        setSuccess("Employee registered successfully!");
      }

      setShowModal(false);
      resetForm();
      await fetchEmployees();

    } catch (err) {
      setError(getErrorMessage(err));

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN DELETE MODAL
  // ==========================================

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
    clearMessages();
  };

  // ==========================================
  // CLOSE DELETE MODAL
  // ==========================================

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  // ==========================================
  // DELETE EMPLOYEE
  // ==========================================

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    try {
      setSaving(true);
      clearMessages();

      // Updated to use UUID endpoint for deletion
      await api.delete(
        `employees/${employeeToDelete.id}/`
      );

      closeDeleteModal();
      setSuccess("Employee deleted successfully!");

      if (employees.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        await fetchEmployees();
      }

    } catch (err) {
      setError(getErrorMessage(err));
      closeDeleteModal();

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // STATUS STYLING
  // ==========================================

  const getStatusStyle = (employeeStatus) => {
    const styles = {
      ACTIVE: "bg-green-100 text-green-700",
      INACTIVE: "bg-gray-100 text-gray-600",
      ON_LEAVE: "bg-purple-100 text-purple-700",
      TERMINATED: "bg-red-100 text-red-600",
    };

    return styles[employeeStatus] ||
      "bg-gray-100 text-gray-600";
  };

  const formatStatus = (value) => {
    return value?.replaceAll("_", " ") || "Unknown";
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const statistics = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      color: "text-[#8069B0]",
      bg: "bg-purple-100",
      line: "bg-[#B7FF4A]",
    },
    {
      title: "Active Employees",
      value: employees.filter(
        e => e.employment_status === "ACTIVE"
      ).length,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
      line: "bg-green-400",
    },
    {
      title: "On Leave",
      value: employees.filter(
        e => e.employment_status === "ON_LEAVE"
      ).length,
      icon: CalendarDays,
      color: "text-purple-600",
      bg: "bg-purple-100",
      line: "bg-purple-400",
    },
    {
      title: "Inactive Employees",
      value: employees.filter(
        e => e.employment_status === "INACTIVE"
      ).length,
      icon: UserMinus,
      color: "text-gray-600",
      bg: "bg-gray-100",
      line: "bg-gray-300",
    },
  ];

  // ==========================================
  // INPUT STYLING
  // ==========================================

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition focus:border-[#B7FF4A] focus:ring-4 focus:ring-[#B7FF4A]/20";

  const labelClass =
    "block text-sm font-semibold text-gray-700 mb-2";

  // ==========================================
  // MAIN RETURN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#F5F3FF] p-4 md:p-8">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

        <div>
          <p className="text-sm font-semibold text-[#927DBB] uppercase tracking-widest">
            People Management
          </p>

          <h1 className="text-3xl font-bold text-[#19192D] mt-2">
            Employees
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your organization's employee records.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#B7FF4A] hover:bg-[#A6ED35] text-[#19192D] font-bold px-6 py-3 rounded-xl shadow-sm transition"
        >
          <Plus size={20} />
          Add Employee
        </button>

      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-between">

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start justify-between gap-3">

          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />

            <p className="text-sm whitespace-pre-line">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {statistics.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >

              <div className="flex items-center justify-between">

                <p className="text-gray-500 text-sm font-medium">
                  {stat.title}
                </p>

                <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={21} className={stat.color} />
                </div>

              </div>

              <h2 className={`text-3xl font-bold ${stat.color} mt-4`}>
                {stat.value}
              </h2>

              <div className={`mt-4 w-12 h-1 ${stat.line} rounded-full`} />

            </div>
          );
        })}

      </div>

      {/* SEARCH AND FILTERS */}

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-100">

        <div className="flex flex-col md:flex-row gap-4">

          <div className="flex-1 relative">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search by name, email, phone or employee number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-4 focus:ring-[#B7FF4A]/20 focus:border-[#B7FF4A]"
            />

          </div>

          <div className="md:w-56">

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#B7FF4A]"
            >

              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>

            </select>

          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
            className="px-5 py-3 rounded-xl bg-[#F1EDFF] text-[#8069B0] font-semibold hover:bg-[#E5DCFF] transition"
          >
            Reset Filters
          </button>

          <button
            type="button"
            onClick={fetchEmployees}
            className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            title="Refresh employees"
          >
            <RefreshCw size={19} />
          </button>

        </div>

      </div>

      {/* EMPLOYEE DIRECTORY */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div>
            <h2 className="text-xl font-bold text-[#19192D]">
              Employee Directory
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              View and manage registered employees.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {totalEmployees} employees
          </span>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="p-16 text-center">

            <Loader2
              size={35}
              className="animate-spin text-purple-500 mx-auto mb-3"
            />

            <p className="text-gray-500">
              Loading employees...
            </p>

          </div>

        ) : error && employees.length === 0 ? (

          <div className="p-12 text-center">

            <AlertCircle
              size={35}
              className="text-red-400 mx-auto mb-3"
            />

            <p className="text-red-500">
              Unable to load employees.
            </p>

            <button
              type="button"
              onClick={fetchEmployees}
              className="mt-4 text-purple-600 font-semibold"
            >
              Try again
            </button>

          </div>

        ) : employees.length === 0 ? (

          <div className="p-12 text-center">

            <Users
              size={45}
              className="text-purple-300 mx-auto mb-3"
            />

            <h3 className="font-bold text-[#19192D]">
              No employees found
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Add an employee to get started.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 bg-[#B7FF4A] px-5 py-2.5 rounded-xl font-bold text-sm"
            >
              Add First Employee
            </button>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left min-w-[950px]">

              <thead className="bg-[#F8F6FF] text-gray-500 text-xs uppercase tracking-wider">

                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>

              </thead>

              <tbody>

                {employees.map((employee) => (

                  <tr
                    key={employee.id}
                    className="border-t border-gray-100 hover:bg-[#FAF9FF] transition"
                  >

                    {/* EMPLOYEE */}

                    <td className="p-4">

                      <div className="flex items-center gap-3">

                        {employee.profile_photo ? (

                          <img
                            src={employee.profile_photo}
                            alt={employee.full_name || "Employee"}
                            className="w-11 h-11 rounded-full object-cover shrink-0"
                          />

                        ) : (

                          <div className="w-11 h-11 rounded-full bg-[#E8E0FF] flex items-center justify-center font-bold text-[#8069B0] shrink-0">
                            {employee.full_name?.charAt(0) || "E"}
                          </div>

                        )}

                        <div className="min-w-0">

                          <p className="font-semibold text-[#19192D]">
                            {employee.full_name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {employee.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* EMPLOYEE NUMBER */}

                    <td className="p-4 text-sm font-medium text-gray-600">
                      {employee.employee_number || "—"}
                    </td>

                    {/* DEPARTMENT */}

                    <td className="p-4 text-sm text-gray-600">
                      {employee.department_name || employee.department || "—"}
                    </td>

                    {/* STATUS */}

                    <td className="p-4">

                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusStyle(employee.employment_status)}`}>
                        {formatStatus(employee.employment_status)}
                      </span>

                    </td>

                    {/* DATE JOINED */}

                    <td className="p-4 text-sm text-gray-600">
                      {employee.date_joined || "—"}
                    </td>

                    {/* ACTIONS */}

                    <td className="p-4">

                      <div className="flex items-center justify-center gap-2">

                        <button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm font-semibold transition"
                        >
                          <Edit size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(employee)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm font-semibold transition"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* PAGINATION */}

        {!loading && totalPages > 1 && (

          <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">

            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(prev => prev - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F1EDFF] text-[#8069B0] disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(prev => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#B7FF4A] text-[#19192D] font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>

            </div>

          </div>

        )}

      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedEmployee
                    ? "Edit Employee"
                    : "Register New Employee"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enter the employee's information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={22} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >

              {/* PERSONAL INFORMATION */}

              <div>

                <h3 className="font-bold text-gray-800 mb-4">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>
                      First Name *
                    </label>

                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Middle Name
                    </label>

                    <input
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Last Name *
                    </label>

                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Gender *
                    </label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Date of Birth *
                    </label>

                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      National ID *
                    </label>

                    <input
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Phone Number *
                    </label>

                    <input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">

                    <label className={labelClass}>
                      Address *
                    </label>

                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={inputClass}
                      rows="3"
                      required
                    />

                  </div>

                </div>

              </div>

              {/* EMPLOYMENT INFORMATION */}

              <div>

                <h3 className="font-bold text-gray-800 mb-4">
                  Employment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* EMPLOYEE NUMBER */}

                  <div>
                    <label className={labelClass}>
                      Employee Number
                    </label>

                    <input
                      name="employee_number"
                      value={formData.employee_number}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label className={labelClass}>
                      Department *
                    </label>

                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleDepartmentChange}
                      className={inputClass}
                      required
                      disabled={dropdownLoading}
                    >

                      <option value="">
                        Select Department
                      </option>

                      {departments.map(department => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </option>
                      ))}

                    </select>
                  </div>

                  {/* DATE JOINED */}

                  <div>
                    <label className={labelClass}>
                      Date Joined *
                    </label>

                    <input
                      type="date"
                      name="date_joined"
                      value={formData.date_joined}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  {/* EMPLOYMENT STATUS */}

                  <div>
                    <label className={labelClass}>
                      Employment Status *
                    </label>

                    <select
                      name="employment_status"
                      value={formData.employment_status}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={
                        selectedEmployee?.employment_status ===
                        "TERMINATED"
                      }
                    >

                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ON_LEAVE">On Leave</option>

                    </select>
                  </div>

                </div>

              </div>

              {/* PROFILE PHOTO */}

              <div>

                <h3 className="font-bold text-gray-800 mb-4">
                  Profile Photo
                </h3>

                <div className="flex items-center gap-5">

                  {photoPreview ? (

                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />

                  ) : (

                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">

                      <Camera
                        size={28}
                        className="text-purple-500"
                      />

                    </div>

                  )}

                  <div>

                    <label className="cursor-pointer bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-semibold text-sm inline-flex items-center gap-2">

                      <Camera size={16} />

                      Upload Photo

                      <input
                        type="file"
                        name="profile_photo"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                      />

                    </label>

                    <p className="text-xs text-gray-400 mt-2">
                      Maximum file size: 5MB
                    </p>

                  </div>

                </div>

              </div>

              {/* FORM ACTIONS */}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-[#B7FF4A] text-[#19192D] font-bold hover:bg-[#A6ED35] disabled:opacity-50 flex items-center justify-center gap-2"
                >

                  {saving ? (

                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Saving...
                    </>

                  ) : (

                    selectedEmployee
                      ? "Update Employee"
                      : "Register Employee"

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* DELETE EMPLOYEE CONFIRMATION */}

      {showDeleteModal && employeeToDelete && (

        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-7">

            {/* DELETE ICON */}

            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">

              <Trash2
                size={30}
                className="text-red-500"
              />

            </div>

            {/* TITLE */}

            <h2 className="text-xl font-bold text-center text-[#19192D]">
              Delete Employee?
            </h2>

            {/* DESCRIPTION */}

            <p className="text-gray-500 text-sm text-center mt-3 leading-relaxed">

              Are you sure you want to delete{" "}

              <span className="font-bold text-gray-800">
                {employeeToDelete.full_name}
              </span>

              ?

              This action cannot be undone.

            </p>

            {/* WARNING */}

            <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4">

              <p className="text-xs text-red-600 leading-relaxed">

                Employees with attendance, leave, salary or payroll records
                cannot be permanently deleted. Your system will protect
                those records and return an explanation.

              </p>

            </div>

            {/* BUTTONS */}

            <div className="flex flex-col sm:flex-row gap-3 mt-7">

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={saving}
                className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-60 transition"
              >

                {saving ? (

                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Deleting...
                  </>

                ) : (

                  <>
                    <Trash2 size={17} />
                    Delete Employee
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Employees;