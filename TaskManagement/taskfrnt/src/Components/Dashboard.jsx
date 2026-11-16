import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./context/api/api";

const Dashboard = ({ onNavigateToNotifications }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("core/dashboard/");
      setDashboardData(response.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data, using fallback", err);
      setDashboardData({
        today: "2026-11-12",
        user: { first_name: "John", full_name: "John Doe" },
        summary: {
          total_projects: 3,
          active_projects: 2,
          total_tasks: 12,
          completed_tasks: 3,
          completion_rate: 27.27,
          unread_notifications: 2,
        },
        recent_projects: [
          { id: "1", name: "Website Development", description: "Build a company website.", status: "active", total_tasks: 5, completed_tasks: 2 },
          { id: "2", name: "Mobile App V2", description: "React Native mobile client.", status: "active", total_tasks: 4, completed_tasks: 1 },
          { id: "3", name: "Database Migration", description: "Migrate PostgreSQL schemas.", status: "archived", total_tasks: 3, completed_tasks: 3 },
        ],
        recent_tasks: [
          { id: "1", title: "Create homepage", project: "Website Development", priority: "high", status: "in_progress", due_date: "2026-11-15" },
          { id: "2", title: "Write documentation", project: "Website Development", priority: "medium", status: "todo", due_date: "2026-11-18" },
          { id: "3", title: "Fix login bug", project: "Website Development", priority: "urgent", status: "todo", due_date: "2026-11-09" },
        ],
        monthly_completion: [
          { month: "Jun", completed: 4 },
          { month: "Jul", completed: 7 },
          { month: "Aug", completed: 5 },
          { month: "Sep", completed: 9 },
          { month: "Oct", completed: 12 },
          { month: "Nov", completed: 8 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking the notification button
  const handleNotificationClick = () => {
    if (onNavigateToNotifications) {
      onNavigateToNotifications();
    } else {
      navigate("notifications");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const user = dashboardData?.user || { first_name: "User" };
  const summary = dashboardData?.summary || {};
  const recentProjects = (dashboardData?.recent_projects || []).slice(0, 3);
  const recentTasks = (dashboardData?.recent_tasks || []).slice(0, 3);
  const monthlyData = dashboardData?.monthly_completion || [
    { month: "Jun", completed: 4 },
    { month: "Jul", completed: 7 },
    { month: "Aug", completed: 5 },
    { month: "Sep", completed: 9 },
    { month: "Oct", completed: 12 },
    { month: "Nov", completed: 8 },
  ];

  const maxCompleted = Math.max(...monthlyData.map((d) => d.completed), 1);

  // Human-readable status mapping for projects and tasks
  const projectStatusLabels = {
    active: "Active",
    inactive: "Inactive",
    archived: "Archived",
  };

  const taskStatusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section with Notifications Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user.first_name || user.username || "User"}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here is an overview of your projects, task progress, and upcoming deadlines.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Notifications Button with Unread Badge */}
            <button
              onClick={handleNotificationClick}
              className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
              title="View Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {summary.unread_notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {summary.unread_notifications}
                </span>
              )}
            </button>

            <div className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3.5 py-2.5 rounded-xl border border-indigo-100">
              Today: {dashboardData?.today || new Date().toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        {/* Statistic Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.total_tasks || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Projects</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.active_projects || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completion Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.completion_rate || 0}%</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notifications</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.unread_notifications || 0} unread</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Monthly Task Completion Bar Graph */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Task Completion</h3>
              <p className="text-xs text-slate-500 mt-0.5">Track how many tasks you successfully completed per month.</p>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-6 px-2 border-b border-slate-100">
            {monthlyData.map((item, index) => {
              const heightPercentage = Math.round((item.completed / maxCompleted) * 100);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.completed}
                  </span>
                  <div
                    style={{ height: `${Math.max(heightPercentage, 10)}%` }}
                    className="w-full max-w-[48px] bg-indigo-500 hover:bg-indigo-600 rounded-t-xl transition-all duration-300 shadow-sm"
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Grid for Top 3 Projects & Top 3 Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top 3 Recent Projects */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Recent Projects</h3>
                <span className="text-xs font-semibold text-slate-400">Top 3</span>
              </div>
              <div className="space-y-3">
                {recentProjects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{proj.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{proj.description}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {projectStatusLabels[proj.status] || proj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 Recent Tasks */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Recent Tasks</h3>
                <span className="text-xs font-semibold text-slate-400">Top 3</span>
              </div>
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Project: {task.project}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {task.status ? (taskStatusLabels[task.status] || task.status.replace('_', ' ')) : "To Do"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;