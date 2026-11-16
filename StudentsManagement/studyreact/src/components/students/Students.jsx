
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  GraduationCap,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import api from "../context/api/api";

// import api from "../../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteStudent, setDeleteStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all students
  const fetchStudents = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("students/");

      const data = response.data;

      setStudents(
        Array.isArray(data) ? data : data.results || []
      );

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Search students
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!search.trim()) {
      fetchStudents();
      return;
    }

    setSearching(true);
    setError("");

    try {
      const response = await api.get(
        `students/search/?search=${encodeURIComponent(search.trim())}`
      );

      const data = response.data;

      setStudents(
        Array.isArray(data) ? data : data.results || []
      );

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Student search failed."
      );
    } finally {
      setSearching(false);
    }
  };

  // Delete student
  const handleDelete = async () => {
    if (!deleteStudent) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await api.delete(`students/${deleteStudent.id}/`);

      setStudents((prev) =>
        prev.filter(
          (student) => student.id !== deleteStudent.id
        )
      );

      setSuccess("Student deleted successfully.");
      setDeleteStudent(null);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to delete student."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Get student full name
  const getStudentName = (student) => {
    const fullName = [
      student.first_name,
      student.middle_name,
      student.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || student.full_name || student.name || "Unnamed Student";
  };

  // Get student initials
  const getInitials = (student) => {
    return getStudentName(student)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Students
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage student records and information.
          </p>
        </div>

        <Link
          to="/students/register"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Register Student
        </Link>

      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total Students
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {students.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={25} />
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Student Records
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {students.length}
              </h2>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <GraduationCap size={25} />
            </div>

          </div>
        </div>

      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <span>{success}</span>

          <button onClick={() => setSuccess("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Student Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Search Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">

          <div>
            <h2 className="font-bold text-slate-800">
              Student Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              View and manage registered students.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <form
              onSubmit={handleSearch}
              className="flex"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full rounded-l-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="rounded-r-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {searching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </form>

            <button
              onClick={() => {
                setSearch("");
                setSuccess("");
                fetchStudents();
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Student
                </th>

                <th className="px-6 py-4 font-semibold">
                  Admission Number
                </th>

                <th className="px-6 py-4 font-semibold">
                  Gender
                </th>

                <th className="px-6 py-4 font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-blue-600"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading students...
                    </p>
                  </td>
                </tr>

              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">

                    <Users
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-medium text-slate-600">
                      No students found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Register a student or try another search.
                    </p>

                  </td>
                </tr>

              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* Student */}
                    <td className="whitespace-nowrap px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {getInitials(student)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {getStudentName(student)}
                          </p>

                          <p className="text-xs text-slate-400">
                            ID: {student.id}
                          </p>
                        </div>

                      </div>

                    </td>

                    {/* Admission */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {student.admission_number || "—"}
                    </td>

                    {/* Gender */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {student.gender || "—"}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4">

                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        {student.status || "Registered"}
                      </span>

                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-6 py-4">

                      <div className="flex items-center justify-end gap-2">

                        <Link
                          to={`/students/${student.id}`}
                          title="View student"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </Link>

                        <Link
                          to={`/students/${student.id}/edit`}
                          title="Edit student"
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Pencil size={17} />
                        </Link>

                        <button
                          onClick={() => setDeleteStudent(student)}
                          title="Delete student"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Table Footer */}
        {!loading && students.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4">
            <p className="text-xs text-slate-500">
              Showing {students.length} student record(s)
            </p>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                Delete Student
              </h2>

              <button
                onClick={() => setDeleteStudent(null)}
                disabled={deleting}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <strong>
                {getStudentName(deleteStudent)}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setDeleteStudent(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Student
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

export default Students;
