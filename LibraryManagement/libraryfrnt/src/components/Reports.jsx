import React, { useState, useEffect } from "react";
import api from "./context/api/api";


const Reports = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States for reports that require date ranges or limits
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [popularLimit, setPopularLimit] = useState(5);

  // Map tab names to their respective Django API endpoints
  const reportEndpoints = {
    dashboard: "reports/dashboard/",
    inventory: "reports/inventory/",
    membership: "reports/membership/",
    circulation: "reports/circulation/",
    popular: "reports/popular-books/",
    overdue: "reports/overdue-loans/",
    fines: "reports/fines/",
    audit: "reports/audit/",
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      
      // Attach date filters if applicable
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      // Attach limit for popular books
      if (activeTab === "popular") {
        params.limit = popularLimit;
      }

      const endpoint = reportEndpoints[activeTab];
      const response = await api.get(endpoint, { params });
      setReportData(response.data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Failed to load report data. Please verify your staff permissions or backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Helper to render JSON data dynamically and cleanly if it's an object or list
  const renderDataContent = (data) => {
    if (!data) return <p className="text-gray-400">No data available.</p>;

    // If data is an array (e.g., list of popular books, audit logs, or overdue items)
    if (Array.isArray(data)) {
      if (data.length === 0) return <p className="text-gray-500">No records found for this period.</p>;
      
      const sampleItem = data[0];
      const keys = typeof sampleItem === "object" && sampleItem !== null ? Object.keys(sampleItem) : [];

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {keys.length > 0 && (
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {keys.map((key) => (
                    <th key={key} className="p-3">{key.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  {typeof item === "object" && item !== null ? (
                    keys.map((key) => (
                      <td key={key} className="p-3 font-mono text-xs">
                        {String(item[key] !== null && item[key] !== undefined ? item[key] : "-")}
                      </td>
                    ))
                  ) : (
                    <td className="p-3">{String(item)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // If data is an object of key-value metrics (e.g., dashboard, inventory counts)
    if (typeof data === "object") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                {key.replace(/_/g, " ")}
              </span>
              <span className="text-2xl font-black text-[#153c32] mt-2" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <div className="p-4 text-gray-700">{String(data)}</div>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            Library Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500">
            View system metrics, circulation history, audit logs, and financial fine summaries.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "inventory", label: "Inventory" },
          { id: "membership", label: "Membership" },
          { id: "circulation", label: "Circulation" },
          { id: "popular", label: "Popular Books" },
          { id: "overdue", label: "Overdue Loans" },
          { id: "fines", label: "Fines" },
          { id: "audit", label: "Audit Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#153c32] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar (Shown for reports supporting date ranges or limits) */}
      {(["circulation", "fines", "audit", "popular"].includes(activeTab)) && (
        <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
          {["circulation", "fines", "audit"].includes(activeTab) && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#153c32] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#153c32] focus:outline-none"
                />
              </div>
            </>
          )}

          {activeTab === "popular" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Result Limit</label>
              <input
                type="number"
                min="1"
                max="50"
                value={popularLimit}
                onChange={(e) => setPopularLimit(e.target.value)}
                className="w-28 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#153c32] focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2 bg-[#153c32] text-white text-sm font-semibold rounded-lg hover:bg-[#225543] transition shadow-sm"
          >
            Apply Filters
          </button>
        </form>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 capitalize" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            {activeTab.replace("-", " ")} Report Summary
          </h2>
          <button
            onClick={fetchReport}
            className="text-xs text-[#153c32] font-semibold hover:underline flex items-center gap-1"
          >
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading report analytics...</div>
        ) : (
          renderDataContent(reportData)
        )}
      </div>

    </div>
  );
};

export default Reports;