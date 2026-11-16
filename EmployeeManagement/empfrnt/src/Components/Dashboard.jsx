
import React, { useState, useEffect, useCallback } from "react";
// import api from "../api";

import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Building2,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Clock,
  RefreshCw,
  AlertCircle,
  Activity,
  Search,
  Banknote,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "./context/api/api";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString();
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  return (name || "Employee")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

// ==========================================
// DASHBOARD COMPONENT
// ==========================================

const Dashboard = () => {

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employeeSearch, setEmployeeSearch] = useState("");

  // ========================================
  // FETCH DASHBOARD DATA
  // ========================================

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("core/dashboard/");

      setDashboardData(response.data);

    } catch (err) {
      console.error("Dashboard Error:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={35}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-4 text-sm text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-xl font-bold text-gray-800">
            Dashboard Error
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            onClick={fetchDashboardData}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // DASHBOARD DATA
  // ========================================

  const summary = dashboardData?.summary || {};

  const departments = dashboardData?.department_headcount || [];
  const employees = dashboardData?.recent_employees || [];
  const leaveRequests = dashboardData?.pending_leave_requests || [];
  const payroll = dashboardData?.recent_payroll || [];
  const activities = dashboardData?.recent_activity || [];

  return (
    <div className="w-full min-w-0 space-y-7 bg-gray-50 p-4 sm:p-6 lg:p-8">
        
{/* ==========================================
    DASHBOARD HEADER
========================================== */}

<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

  <div>
    <h1 className="text-2xl font-bold text-gray-800">
      Dashboard Overview
    </h1>

    <p className="mt-1 text-sm text-gray-500">
      Welcome back! Here's what's happening in your organization.
    </p>
  </div>

  <div className="flex items-center gap-3">

    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
      <CalendarDays size={17} className="mr-2 inline text-blue-600" />
      {formatDate(dashboardData?.today)}
    </div>

    <button
      onClick={fetchDashboardData}
      className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-100"
    >
      <RefreshCw size={18} />
    </button>

  </div>
</div>

{/* ==========================================
    EMPLOYEE STATISTICS
========================================== */}

<div>
  <h2 className="mb-5 text-lg font-bold text-gray-800">
    Employee Statistics
  </h2>

  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

    {[
      {
        title: "Total Employees",
        value: summary.total_employees,
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-100",
        description: "Total registered employees",
      },
      {
        title: "Active Employees",
        value: summary.active_employees,
        icon: UserCheck,
        color: "text-green-600",
        bg: "bg-green-100",
        description: "Currently active employees",
      },
      {
        title: "Employees on Leave",
        value: summary.on_leave_employees,
        icon: CalendarCheck,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        description: "Currently on leave",
      },
      {
        title: "New Hires",
        value: summary.new_hires_30_days,
        icon: UserPlus,
        color: "text-purple-600",
        bg: "bg-purple-100",
        description: "Joined in the last 30 days",
      },
    ].map((item) => {
      const Icon = item.icon;

      return (
        <div
          key={item.title}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                {item.title}
              </p>

              <h3 className="mt-3 text-2xl font-bold text-gray-800">
                {formatNumber(item.value)}
              </h3>
            </div>

            <div className={`rounded-xl p-3 ${item.bg}`}>
              <Icon size={25} className={item.color} />
            </div>

          </div>

          <p className="mt-4 text-xs text-gray-400">
            {item.description}
          </p>
        </div>
      );
    })}

  </div>
</div>

{/* ==========================================
    ORGANIZATION STATISTICS
========================================== */}

<div>
  <h2 className="mb-5 text-lg font-bold text-gray-800">
    Organization Overview
  </h2>

  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

    {[
      {
        title: "Departments",
        value: summary.total_departments,
        icon: Building2,
        color: "text-indigo-600",
        bg: "bg-indigo-100",
      },
      {
        title: "Positions",
        value: summary.total_positions,
        icon: BriefcaseBusiness,
        color: "text-pink-600",
        bg: "bg-pink-100",
      },
      {
        title: "Inactive Employees",
        value: summary.inactive_employees,
        icon: UserMinus,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        title: "Terminated Employees",
        value: summary.terminated_employees,
        icon: Users,
        color: "text-red-600",
        bg: "bg-red-100",
      },
    ].map((item) => {
      const Icon = item.icon;

      return (
        <div
          key={item.title}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                {item.title}
              </p>

              <h3 className="mt-3 text-2xl font-bold text-gray-800">
                {formatNumber(item.value)}
              </h3>
            </div>

            <div className={`rounded-xl p-3 ${item.bg}`}>
              <Icon size={25} className={item.color} />
            </div>

          </div>
        </div>
      );
    })}

  </div>
</div>
{/* ==========================================
    ATTENDANCE AND DEPARTMENT CHARTS
========================================== */}

<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

  {/* ATTENDANCE */}

  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800">
        Today's Attendance
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Daily employee attendance overview
      </p>
    </div>

    {(() => {
      const attendanceData = [
        { name: "Present", value: Number(summary.present_today || 0), color: "#16A34A" },
        { name: "Absent", value: Number(summary.absent_today || 0), color: "#EF4444" },
        { name: "Late", value: Number(summary.late_today || 0), color: "#F59E0B" },
        { name: "Half Day", value: Number(summary.half_day_today || 0), color: "#3B82F6" },
        { name: "On Leave", value: Number(summary.on_leave_today || 0), color: "#8B5CF6" },
      ];

      const total = attendanceData.reduce(
        (sum, item) => sum + item.value, 0
      );

      return total === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          No attendance records available today.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {attendanceData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">

            <div>
              <p className="text-sm text-gray-500">
                Total Attendance Records
              </p>
              <h3 className="text-3xl font-bold text-gray-800">
                {formatNumber(total)}
              </h3>
            </div>

            {attendanceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.name}
                  </span>
                </div>

                <span className="font-semibold text-gray-800">
                  {formatNumber(item.value)}
                </span>

              </div>
            ))}

          </div>
        </div>
      );
    })()}

  </div>

  {/* DEPARTMENT HEADCOUNT */}

  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800">
        Department Headcount
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Employee distribution across departments
      </p>
    </div>

    {departments.length === 0 ? (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        No department data available.
      </div>
    ) : (
      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={departments}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
            />

            <XAxis type="number" />

            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11 }}
            />

            <Tooltip />

            <Bar
              dataKey="headcount"
              fill="#2563EB"
              radius={[0, 6, 6, 0]}
            />

          </BarChart>
        </ResponsiveContainer>

      </div>
    )}

  </div>

</div>
{/* ==========================================
    GENDER AND PAYROLL
========================================== */}

<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

  {/* GENDER DISTRIBUTION */}

  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800">
        Gender Distribution
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Workforce demographic overview
      </p>
    </div>

    {(() => {
      const genderData = Object.entries(
        dashboardData?.gender_breakdown || {}
      ).map(([name, value]) => ({
        name,
        value: Number(value || 0),
      }));

      const colors = ["#2563EB", "#EC4899", "#F59E0B"];

      return genderData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          No gender data available.
        </div>
      ) : (
        <div className="h-72">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={4}
              >
                {genderData.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

        </div>
      );
    })()}

  </div>

  {/* PAYROLL OVERVIEW */}

  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-gray-800">
          Payroll Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Monthly payroll summary
        </p>
      </div>

      <div className="rounded-lg bg-green-50 p-3 text-green-600">
        <Wallet size={23} />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

      <div className="rounded-xl bg-blue-50 p-5">
        <p className="text-sm text-gray-500">
          Gross Payroll
        </p>
        <h3 className="mt-2 text-xl font-bold text-blue-700">
          {formatMoney(summary.monthly_payroll_gross)}
        </h3>
      </div>

      <div className="rounded-xl bg-green-50 p-5">
        <p className="text-sm text-gray-500">
          Net Payroll
        </p>
        <h3 className="mt-2 text-xl font-bold text-green-700">
          {formatMoney(summary.monthly_payroll_net)}
        </h3>
      </div>

      <div className="rounded-xl bg-purple-50 p-5">
        <p className="text-sm text-gray-500">
          Payroll Records This Month
        </p>
        <h3 className="mt-2 text-2xl font-bold text-purple-700">
          {formatNumber(summary.monthly_payroll_count)}
        </h3>
      </div>

      <div className="rounded-xl bg-amber-50 p-5">
        <p className="text-sm text-gray-500">
          Active Salary Structures
        </p>
        <h3 className="mt-2 text-2xl font-bold text-amber-700">
          {formatNumber(summary.active_salary_structures)}
        </h3>
      </div>

    </div>

    <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">

      {[
        {
          label: "Pending Payroll",
          value: summary.pending_payroll,
          color: "bg-amber-500",
        },
        {
          label: "Processed Payroll",
          value: summary.processed_payroll,
          color: "bg-blue-500",
        },
        {
          label: "Paid Payroll",
          value: summary.paid_payroll,
          color: "bg-green-500",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            <span className="text-sm text-gray-600">
              {item.label}
            </span>
          </div>

          <span className="font-bold text-gray-800">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}

    </div>

  </div>

</div>{/* ==========================================
    LEAVE MANAGEMENT OVERVIEW
========================================== */}

<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-800">
      Leave Management Overview
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Summary of employee leave requests
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

    {[
      {
        title: "Pending Requests",
        value: summary.pending_leave_requests,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        title: "Approved Requests",
        value: summary.approved_leave_requests,
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        title: "Rejected Requests",
        value: summary.rejected_leave_requests,
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
      },
      {
        title: "Employees Away Today",
        value: summary.employees_away_today,
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
    ].map((item) => {
      const Icon = item.icon;

      return (
        <div
          key={item.title}
          className={`rounded-xl p-5 ${item.bg}`}
        >
          <Icon size={25} className={item.color} />

          <h3 className={`mt-3 text-2xl font-bold ${item.color}`}>
            {formatNumber(item.value)}
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            {item.title}
          </p>
        </div>
      );
    })}

  </div>

  <div className="mt-5 flex justify-between border-t border-gray-100 pt-4 text-sm">
    <span className="text-gray-500">
      Cancelled Leave Requests
    </span>

    <span className="font-semibold text-gray-800">
      {formatNumber(summary.cancelled_leave_requests)}
    </span>
  </div>

</div>
{/* ==========================================
    RECENT EMPLOYEES
========================================== */}

<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

  <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center">

    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Recent Employees
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Latest employee registrations
      </p>
    </div>

    <div className="relative">
      <Search
        size={17}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        placeholder="Search employees..."
        className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
        onChange={(e) => {
          // Search can be added to state if desired.
          setEmployeeSearch(e.target.value);
        }}
        value={employeeSearch}
      />
    </div>

  </div>

  <div className="overflow-x-auto">

    <table className="w-full min-w-[750px] text-left text-sm">

      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th className="px-6 py-4">Employee</th>
          <th className="px-6 py-4">Department</th>
          <th className="px-6 py-4">Position</th>
          <th className="px-6 py-4">Date Joined</th>
          <th className="px-6 py-4">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">

        {employees
          .filter((employee) =>
            [
              employee.full_name,
              employee.employee_number,
              employee.department,
              employee.position,
            ]
              .join(" ")
              .toLowerCase()
              .includes(employeeSearch.toLowerCase())
          )
          .map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50">

              <td className="px-6 py-4">
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {getInitials(employee.full_name)}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">
                      {employee.full_name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {employee.employee_number}
                    </p>
                  </div>

                </div>
              </td>

              <td className="px-6 py-4 text-gray-600">
                {employee.department || "N/A"}
              </td>

              <td className="px-6 py-4 text-gray-600">
                {employee.position || "N/A"}
              </td>

              <td className="px-6 py-4 text-gray-600">
                {formatDate(employee.date_joined)}
              </td>

              <td className="px-6 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  employee.employment_status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : employee.employment_status === "ON_LEAVE"
                    ? "bg-yellow-100 text-yellow-700"
                    : employee.employment_status === "TERMINATED"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {(employee.employment_status || "UNKNOWN").replaceAll("_", " ")}
                </span>
              </td>

            </tr>
          ))}

        {employees.filter((employee) =>
          [
            employee.full_name,
            employee.employee_number,
            employee.department,
            employee.position,
          ]
            .join(" ")
            .toLowerCase()
            .includes(employeeSearch.toLowerCase())
        ).length === 0 && (
          <tr>
            <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
              No employees found.
            </td>
          </tr>
        )}

      </tbody>

    </table>

  </div>

</div>
{/* ==========================================
    PENDING LEAVE REQUESTS
========================================== */}

<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

  <div className="border-b border-gray-100 p-6">
    <h2 className="text-lg font-bold text-gray-800">
      Pending Leave Requests
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Leave applications waiting for approval
    </p>
  </div>

  <div className="overflow-x-auto">

    <table className="w-full min-w-[700px] text-left text-sm">

      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th className="px-6 py-4">Employee</th>
          <th className="px-6 py-4">Leave Type</th>
          <th className="px-6 py-4">Start Date</th>
          <th className="px-6 py-4">End Date</th>
          <th className="px-6 py-4">Days</th>
          <th className="px-6 py-4">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">

        {leaveRequests.map((leave) => (
          <tr key={leave.id} className="hover:bg-gray-50">

            <td className="px-6 py-4">
              <p className="font-semibold text-gray-800">
                {leave.employee}
              </p>
              <p className="text-xs text-gray-500">
                {leave.employee_number}
              </p>
            </td>

            <td className="px-6 py-4 text-gray-600">
              {leave.leave_type}
            </td>

            <td className="px-6 py-4 text-gray-600">
              {formatDate(leave.start_date)}
            </td>

            <td className="px-6 py-4 text-gray-600">
              {formatDate(leave.end_date)}
            </td>

            <td className="px-6 py-4 font-semibold text-gray-800">
              {leave.days_requested}
            </td>

            <td className="px-6 py-4">
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                PENDING
              </span>
            </td>

          </tr>
        ))}

        {leaveRequests.length === 0 && (
          <tr>
            <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
              No pending leave requests.
            </td>
          </tr>
        )}

      </tbody>

    </table>

  </div>

</div>
{/* ==========================================
    RECENT PAYROLL
========================================== */}

<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

  <div className="border-b border-gray-100 p-6">
    <h2 className="text-lg font-bold text-gray-800">
      Recent Payroll
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Latest employee payroll transactions
    </p>
  </div>

  <div className="overflow-x-auto">

    <table className="w-full min-w-[700px] text-left text-sm">

      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th className="px-6 py-4">Employee</th>
          <th className="px-6 py-4">Reference</th>
          <th className="px-6 py-4">Pay Period</th>
          <th className="px-6 py-4">Net Salary</th>
          <th className="px-6 py-4">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">

        {payroll.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50">

            <td className="px-6 py-4">
              <p className="font-semibold text-gray-800">
                {item.employee}
              </p>
              <p className="text-xs text-gray-500">
                {item.employee_number}
              </p>
            </td>

            <td className="px-6 py-4 text-gray-600">
              {item.reference_number || "N/A"}
            </td>

            <td className="px-6 py-4 text-gray-600">
              {formatDate(item.pay_period_start)}
              {" - "}
              {formatDate(item.pay_period_end)}
            </td>

            <td className="px-6 py-4 font-semibold text-gray-800">
              {item.currency} {formatMoney(item.net_salary)}
            </td>

            <td className="px-6 py-4">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                item.status === "PAID"
                  ? "bg-green-100 text-green-700"
                  : item.status === "PROCESSED"
                  ? "bg-blue-100 text-blue-700"
                  : item.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {item.status}
              </span>
            </td>

          </tr>
        ))}

        {payroll.length === 0 && (
          <tr>
            <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
              No payroll records available.
            </td>
          </tr>
        )}

      </tbody>

    </table>

  </div>

</div>
{/* ==========================================
    RECENT SYSTEM ACTIVITY
========================================== */}

<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-800">
      Recent System Activity
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Latest actions performed in the system
    </p>
  </div>

  <div className="space-y-5">

    {activities.map((item) => (
      <div key={item.id} className="flex gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Activity size={18} />
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-sm font-semibold text-gray-800">
            {item.description || item.action}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {item.user || "System"} · {item.model_name}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {formatDate(item.created_at)}
          </p>

        </div>

        <span className="h-fit rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
          {item.action}
        </span>

      </div>
    ))}

    {activities.length === 0 && (
      <p className="py-8 text-center text-sm text-gray-500">
        No recent activity available.
      </p>
    )}

  </div>

</div>
{/* ==========================================
    DASHBOARD FOOTER
========================================== */}

<footer className="border-t border-gray-200 py-5 text-center">
  <p className="text-xs text-gray-400">
    Employee Management System © {new Date().getFullYear()}
  </p>
  <p className="mt-1 text-xs text-gray-400">
    Dashboard data powered by your HR management system.
  </p>
</footer>
    </div>
  );
};

export default Dashboard;
