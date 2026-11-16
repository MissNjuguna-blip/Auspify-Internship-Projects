
import React, { useEffect, useState } from "react";
import api from "./context/api/api";
// import api from "../../api/axios";

// ======================================================
// HELPER FUNCTIONS
// ======================================================

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatMonth = (month) => {
  if (!month) return "";
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );
};

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mt-2">
          {value}
        </h3>
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      </div>

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-5">
    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    {subtitle && (
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    )}
  </div>
);

// ======================================================
// MAIN PAYROLL COMPONENT
// ======================================================

const PayRoll = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Overview states
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // ====================================================
  // FETCH PAYROLL SUMMARY
  // ====================================================

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/payroll/summary/", {
        params: {
          month: selectedMonth,
        },
      });

      setSummary(response.data);
    } catch (err) {
      console.error("Payroll summary error:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to load payroll summary."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  // ====================================================
  // NAVIGATION
  // ====================================================

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "records", label: "Payroll Records", icon: "📋" },
    { id: "generate", label: "Generate Payroll", icon: "➕" },
    { id: "structures", label: "Salary Structures", icon: "💰" },
    { id: "reports", label: "Reports", icon: "📈" },
  ];

  // ====================================================
  // OVERVIEW SECTION
  // ====================================================

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchSummary}
            className="mt-3 text-sm text-blue-600 font-semibold"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!summary) return null;

    const totals = summary.totals || {};
    const outstanding = summary.outstanding || {};
    const departments = summary.by_department || [];
    const trend = summary.trend || [];
    const maxNet = Math.max(
      ...trend.map((item) => Number(item.net_salary || 0)),
      1
    );

    return (
      <div className="space-y-6">

        {/* MONTH FILTER */}

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Payroll Overview
            </h2>
            <p className="text-sm text-gray-500">
              Financial summary and payroll performance.
            </p>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          <StatCard
            title="Total Employees"
            value={totals.employees || 0}
            subtitle="Employees included in payroll"
            icon="👥"
            color="bg-blue-50"
          />

          <StatCard
            title="Basic Salary"
            value={formatMoney(totals.basic_salary)}
            subtitle="Total basic salary"
            icon="💵"
            color="bg-indigo-50"
          />

          <StatCard
            title="Total Allowances"
            value={formatMoney(totals.allowances)}
            subtitle="Employee allowances"
            icon="➕"
            color="bg-green-50"
          />

          <StatCard
            title="Total Deductions"
            value={formatMoney(totals.deductions)}
            subtitle="Payroll deductions"
            icon="➖"
            color="bg-red-50"
          />

          <StatCard
            title="Gross Salary"
            value={formatMoney(totals.gross_salary)}
            subtitle="Before deductions"
            icon="💰"
            color="bg-purple-50"
          />

          <StatCard
            title="Net Salary"
            value={formatMoney(totals.net_salary)}
            subtitle="Total take-home pay"
            icon="🏦"
            color="bg-emerald-50"
          />

        </div>

        {/* OUTSTANDING PAYROLL */}

        <div>
          <SectionTitle
            title="Outstanding Payroll"
            subtitle="Payroll records requiring further action."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <p className="text-sm text-amber-700 font-medium">
                Awaiting Processing
              </p>
              <h3 className="text-2xl font-bold text-amber-800 mt-2">
                {outstanding.awaiting_processing || 0}
              </h3>
              <p className="text-xs text-amber-600 mt-2">
                Pending payroll records
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <p className="text-sm text-blue-700 font-medium">
                Awaiting Payment
              </p>
              <h3 className="text-2xl font-bold text-blue-800 mt-2">
                {outstanding.awaiting_payment || 0}
              </h3>
              <p className="text-xs text-blue-600 mt-2">
                Processed payroll records
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <p className="text-sm text-green-700 font-medium">
                Amount Awaiting Payment
              </p>
              <h3 className="text-xl font-bold text-green-800 mt-2">
                {formatMoney(outstanding.amount_awaiting_payment)}
              </h3>
              <p className="text-xs text-green-600 mt-2">
                Outstanding net payroll
              </p>
            </div>

          </div>
        </div>

        {/* PAYROLL TREND */}

        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">

          <SectionTitle
            title="Payroll Trend"
            subtitle="Monthly net salary expenditure over the last 12 months."
          />

          <div className="flex items-end gap-2 sm:gap-4 h-64 overflow-x-auto">

            {trend.map((item, index) => {
              const amount = Number(item.net_salary || 0);
              const height = (amount / maxNet) * 100;

              return (
                <div
                  key={item.month || index}
                  className="flex-1 min-w-8 h-full flex flex-col justify-end items-center gap-2"
                >
                  <span className="text-[10px] text-gray-500">
                    {amount > 0 ? formatMoney(amount) : "0"}
                  </span>

                  <div className="w-full h-40 flex items-end">
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all"
                      style={{
                        height: `${Math.max(height, amount > 0 ? 3 : 0)}%`,
                      }}
                      title={`${formatMonth(item.month)}: ${formatMoney(amount)}`}
                    />
                  </div>

                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {formatMonth(item.month).split(" ")[0]}
                  </span>
                </div>
              );
            })}

          </div>
        </div>

        {/* DEPARTMENT BREAKDOWN */}

        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">

          <SectionTitle
            title="Department Payroll Breakdown"
            subtitle="Payroll expenditure grouped by department."
          />

          {departments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No department payroll data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Employees</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">Net Salary</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {departments.map((department, index) => (
                    <tr
                      key={`${department.department}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 font-medium text-gray-800">
                        {department.department || "Unassigned"}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {department.employees}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {formatMoney(department.gross_salary)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-800">
                        {formatMoney(department.net_salary)}
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>
    );
  };

  // ====================================================
  // MAIN RENDER
  // ====================================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Payroll Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage employee salaries, payroll processing and payments.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          ↻ Refresh
        </button>

      </div>

      {/* NAVIGATION */}

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}

      </div>

      {/* SECTION CONTENT */}

      {activeTab === "overview" && renderOverview()}

      {activeTab !== "overview" && (
        <div className="bg-white border rounded-xl p-10 text-center">
          <p className="text-gray-500">
            {tabs.find((tab) => tab.id === activeTab)?.label} section
            will be added next.
          </p>
        </div>
      )}

    </div>
  );
};

export default PayRoll;
