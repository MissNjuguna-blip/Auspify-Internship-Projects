import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  UserCheck,
  CalendarDays,
  ClipboardList,
  Wallet,
  FileText,
  Megaphone,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  Calendar,
  Activity,
} from "lucide-react";
import api from "./context/api/api";

// import api from "../context/api/api";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------
  // FETCH DASHBOARD DATA
  // -----------------------------------------

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("core/dashboard/");

      setDashboardData(response.data);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // -----------------------------------------
  // DATA
  // -----------------------------------------

  const summary = dashboardData?.summary || {};

  const recentStudents = dashboardData?.recent_students || [];
  const recentEnrollments = dashboardData?.recent_enrollments || [];
  const recentPayments = dashboardData?.recent_payments || [];
  const recentAnnouncements = dashboardData?.recent_announcements || [];

  const formatCurrency = (amount) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const today = dashboardData?.today
    ? formatDate(dashboardData.today)
    : formatDate(new Date());

  // -----------------------------------------
  // STATISTICS
  // -----------------------------------------

  const statistics = [
    {
      title: "Total Students",
      value: summary.total_students,
      icon: Users,
      color: "blue",
      link: "/students",
    },
    
    {
      title: "Classrooms",
      value: summary.total_classrooms,
      icon: GraduationCap,
      color: "green",
      link: "/academics/classrooms",
    },
    {
      title: "Academic Years",
      value: summary.total_academic_years,
      icon: CalendarDays,
      color: "indigo",
      link: "/academics/academic-years",
    },
    {
      title: "Subjects",
      value: summary.total_subjects,
      icon: BookOpen,
      color: "pink",
      link: "/academics/subjects",
    },
    {
      title: "Enrollments",
      value: summary.total_enrollments,
      icon: ClipboardList,
      color: "cyan",
      link: "/students/enrollments",
    },
    {
      title: "Examinations",
      value: summary.total_examinations,
      icon: FileText,
      color: "amber",
      link: "/examinations",
    },
  ];

  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    indigo: "bg-indigo-50 text-indigo-600",
    pink: "bg-pink-50 text-pink-600",
    cyan: "bg-cyan-50 text-cyan-600",
    amber: "bg-amber-50 text-amber-600",
  };

  // -----------------------------------------
  // ATTENDANCE STATISTICS
  // -----------------------------------------

  const attendanceStats = [
    {
      title: "Present",
      value: summary.present_attendance,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Absent",
      value: summary.absent_attendance,
      icon: XCircle,
      color: "red",
    },
    {
      title: "Late",
      value: summary.late_attendance,
      icon: Clock,
      color: "orange",
    },
    {
      title: "Excused",
      value: summary.excused_attendance,
      icon: Calendar,
      color: "blue",
    },
  ];

  const attendanceColors = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
    blue: "text-blue-600",
  };

  // -----------------------------------------
  // QUICK ACTIONS
  // -----------------------------------------

  const quickActions = [
    {
      title: "Register Student",
      description: "Add a new student to the system.",
      icon: Users,
      color: "blue",
      link: "/students/register",
    },
    {
      title: "Manage Academic Years",
      description: "Configure academic sessions.",
      icon: CalendarDays,
      color: "purple",
      link: "/academics/academic-years",
    },
    {
      title: "Manage Classrooms",
      description: "View and manage classrooms.",
      icon: School,
      color: "orange",
      link: "/academics/classrooms",
    },
    {
      title: "Manage Enrollments",
      description: "Assign students to classrooms.",
      icon: ClipboardList,
      color: "green",
      link: "/academics/enrollments",
    },
    {
      title: "Manage Schools",
      description: "Manage registered schools.",
      icon: GraduationCap,
      color: "indigo",
      link: "/administration/schools",
    },
    {
      title: "Announcements",
      description: "Manage school announcements.",
      icon: Megaphone,
      color: "pink",
      link: "/announcements",
    },
  ];

  return (
    <div className="space-y-7">

      {/* ---------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------- */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here's what's happening in your school.
          </p>

          <p className="mt-2 text-xs text-slate-400">
            <Calendar size={13} className="mr-1 inline" />
            {today}
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Dashboard
        </button>

      </div>

      {/* ---------------------------------- */}
      {/* ERROR MESSAGE */}
      {/* ---------------------------------- */}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <AlertCircle size={20} />

          <div className="flex-1">
            {error}
          </div>

          <button
            onClick={fetchDashboardData}
            className="font-semibold hover:underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* ---------------------------------- */}
      {/* MAIN STATISTICS */}
      {/* ---------------------------------- */}

      <section>

        <div className="mb-4">
          <h2 className="font-bold text-slate-800">
            School Statistics
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Overview of your school's records.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {statistics.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.title}
                to={stat.link}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-2 text-3xl font-bold text-slate-800">
                      {loading ? (
                        <Loader2
                          size={24}
                          className="animate-spin"
                        />
                      ) : (
                        Number(stat.value || 0).toLocaleString()
                      )}
                    </h3>
                  </div>

                  <div
                    className={`rounded-xl p-3 ${colorStyles[stat.color]}`}
                  >
                    <Icon size={25} />
                  </div>

                </div>

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
                  View details
                  <ArrowRight size={14} />
                </div>

              </Link>
            );
          })}

        </div>

      </section>

      {/* ---------------------------------- */}
      {/* ATTENDANCE */}
      {/* ---------------------------------- */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="font-bold text-slate-800">
              Attendance Overview
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Overall student attendance records.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <Activity size={24} />
          </div>

        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {attendanceStats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-500">
                      {item.title}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-slate-800">
                      {loading ? "..." : Number(item.value || 0).toLocaleString()}
                    </h3>
                  </div>

                  <Icon
                    size={25}
                    className={attendanceColors[item.color]}
                  />

                </div>

              </div>
            );
          })}

        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

          <p className="text-sm text-slate-500">
            Total Attendance Records
          </p>

          <p className="font-bold text-slate-800">
            {loading ? "..." : Number(summary.total_attendance || 0).toLocaleString()}
          </p>

        </div>

      </section>

      {/* ---------------------------------- */}
      {/* EXAMINATION AND FINANCE */}
      {/* ---------------------------------- */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Examination Summary */}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-800">
                Examination Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Examination and student performance records.
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <FileText size={24} />
            </div>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">

            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-purple-700">
                Examinations
              </p>

              <h3 className="mt-2 text-2xl font-bold text-purple-800">
                {loading ? "..." : summary.total_examinations || 0}
              </h3>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Student Results
              </p>

              <h3 className="mt-2 text-2xl font-bold text-blue-800">
                {loading ? "..." : summary.total_results || 0}
              </h3>
            </div>

          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

            <span className="text-sm text-slate-500">
              Average Marks
            </span>

            <span className="text-xl font-bold text-slate-800">
              {loading ? "..." : Number(summary.average_marks || 0).toFixed(2)}
            </span>

          </div>

          <Link
            to="/examinations"
            className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage Examinations
            <ArrowRight size={16} />
          </Link>

        </section>

        {/* Finance Summary */}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-800">
                Finance Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                School payment summary.
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <Wallet size={24} />
            </div>

          </div>

          <div className="mt-5 space-y-4">

            <div className="rounded-lg bg-green-50 p-4">

              <p className="text-sm text-green-700">
                Total Payments
              </p>

              <h3 className="mt-2 text-2xl font-bold text-green-800">
                {loading ? "..." : formatCurrency(summary.total_payments)}
              </h3>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-lg bg-blue-50 p-4">

                <p className="text-xs text-blue-700">
                  Payment Count
                </p>

                <h3 className="mt-2 text-xl font-bold text-blue-800">
                  {loading ? "..." : summary.payment_count || 0}
                </h3>

              </div>

              <div className="rounded-lg bg-purple-50 p-4">

                <p className="text-xs text-purple-700">
                  Average Payment
                </p>

                <h3 className="mt-2 text-lg font-bold text-purple-800">
                  {loading ? "..." : formatCurrency(summary.average_payment)}
                </h3>

              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">

              <div>
                <p className="text-sm font-medium text-slate-700">
                  This Month
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {summary.monthly_payment_count || 0} payment(s)
                </p>
              </div>

              <p className="text-lg font-bold text-green-700">
                {loading ? "..." : formatCurrency(summary.monthly_payments)}
              </p>

            </div>

          </div>

          <Link
            to="/finance/payments"
            className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View Payments
            <ArrowRight size={16} />
          </Link>

        </section>

      </div>

      {/* ---------------------------------- */}
      {/* RECENT STUDENTS */}
      {/* ---------------------------------- */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-5">

          <div>
            <h2 className="font-bold text-slate-800">
              Recent Students
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Recently registered students.
            </p>
          </div>

          <Link
            to="/students"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Admission Number</th>
                <th className="px-5 py-4">Registration Date</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : recentStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-sm text-slate-500">
                    No student records available.
                  </td>
                </tr>
              ) : (
                recentStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-slate-50"
                  >

                    <td className="whitespace-nowrap px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {(student.full_name || student.first_name || "S")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span className="text-sm font-semibold text-slate-800">
                          {student.full_name ||
                            `${student.first_name || ""} ${student.last_name || ""}`.trim()}
                        </span>

                      </div>

                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {student.admission_number || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDate(student.created_at)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">

                      <Link
                        to={`/students/${student.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ---------------------------------- */}
      {/* RECENT ENROLLMENTS */}
      {/* ---------------------------------- */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-5">

          <div>
            <h2 className="font-bold text-slate-800">
              Recent Enrollments
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest student classroom placements.
            </p>
          </div>

          <Link
            to="/academics/enrollments"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Admission Number</th>
                <th className="px-5 py-4">Classroom</th>
                <th className="px-5 py-4">Academic Year</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : recentEnrollments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-sm text-slate-500">
                    No enrollment records available.
                  </td>
                </tr>
              ) : (
                recentEnrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                      {enrollment.student || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {enrollment.admission_number || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {enrollment.classroom || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {enrollment.academic_year || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDate(enrollment.enrollment_date)}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ---------------------------------- */}
      {/* RECENT PAYMENTS AND ANNOUNCEMENTS */}
      {/* ---------------------------------- */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Payments */}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-5">

            <div>
              <h2 className="font-bold text-slate-800">
                Recent Payments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest financial transactions.
              </p>
            </div>

            <Banknote size={23} className="text-green-600" />

          </div>

          <div className="divide-y divide-slate-100">

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto animate-spin text-blue-600" />
              </div>
            ) : recentPayments.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No payment records available.
              </p>
            ) : (
              recentPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 p-4"
                >

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {payment.student || "Unknown Student"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {payment.reference_number || "No reference"} · {formatDate(payment.payment_date)}
                    </p>
                  </div>

                  <p className="whitespace-nowrap text-sm font-bold text-green-700">
                    {formatCurrency(payment.amount)}
                  </p>

                </div>
              ))
            )}

          </div>

          <div className="border-t border-slate-100 p-4">
            <Link
              to="/finance/payments"
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All Payments
              <ArrowRight size={15} />
            </Link>
          </div>

        </section>

        {/* Announcements */}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 p-5">

            <div>
              <h2 className="font-bold text-slate-800">
                Recent Announcements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest school communications.
              </p>
            </div>

            <Megaphone size={23} className="text-purple-600" />

          </div>

          <div className="divide-y divide-slate-100">

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto animate-spin text-blue-600" />
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No announcements available.
              </p>
            ) : (
              recentAnnouncements.slice(0, 5).map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {announcement.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {announcement.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        By {announcement.created_by || "Administrator"} · {formatDate(announcement.created_at)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        announcement.published
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {announcement.published ? "Published" : "Draft"}
                    </span>

                  </div>

                </div>
              ))
            )}

          </div>

          <div className="border-t border-slate-100 p-4">
            <Link
              to="/announcements"
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Announcements
              <ArrowRight size={15} />
            </Link>
          </div>

        </section>

      </div>

      {/* ---------------------------------- */}
      {/* QUICK ACTIONS */}
      {/* ---------------------------------- */}

      <section>

        <div className="mb-4">
          <h2 className="font-bold text-slate-800">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Common administrative tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.link}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
              >

                <div className={`rounded-xl p-3 ${colorStyles[action.color]}`}>
                  <Icon size={23} />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>

                <ArrowRight
                  size={17}
                  className="text-slate-400"
                />

              </Link>
            );
          })}

        </div>

      </section>

    </div>
  );
};

export default Dashboard;
