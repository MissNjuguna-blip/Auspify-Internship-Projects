
import { useEffect, useState } from "react";

import {
  Link2,
  UserRound,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

import api from "../context/api/api";

const StudentGuardian = () => {
  const [students, setStudents] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [formData, setFormData] = useState({
    student: "",
    guardian: "",
    is_primary: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteRelationship, setDeleteRelationship] = useState(null);

  const getList = (data) =>
    Array.isArray(data) ? data : data?.results || [];

  // Fetch all required information
  const fetchData = async () => {
  setLoading(true);
  setError("");

  try {
    const [studentResponse, guardianResponse] = await Promise.all([
      api.get("students/"),
      api.get("students/guardians/"),
    ]);

    const studentList = getList(studentResponse.data);
    const guardianList = getList(guardianResponse.data);

    setStudents(studentList);
    setGuardians(guardianList);

    const relationshipResponses = await Promise.all(
      studentList.map((student) =>
        api.get(`students/${student.id}/guardians/`)
      )
    );

    const allRelationships = relationshipResponses.flatMap(
      (response) => getList(response.data)
    );

    setRelationships(allRelationships);

  } catch (err) {
    setError(
      err.response?.data?.detail ||
      "Failed to load student-guardian relationships."
    );
  } finally {
    setLoading(false);
  }
};
  // Handle input changes
  const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  if (!formData.student || !formData.guardian) {
    setError("Please select both a student and guardian.");
    return;
  }

  const duplicate = relationships.some(
    (item) =>
      String(item.student) === String(formData.student) &&
      String(item.guardian) === String(formData.guardian)
  );

  if (duplicate) {
    setError("This guardian is already linked to this student.");
    return;
  }

  setSaving(true);

  try {
    await api.post(
      `students/${formData.student}/guardians/`,
      {
        guardian: Number(formData.guardian),
        is_primary: formData.is_primary,
      }
    );

    setSuccess("Guardian successfully linked to student.");

    setFormData({
      student: "",
      guardian: "",
      is_primary: false,
    });

    await fetchData();

  } catch (err) {
    const data = err.response?.data;

    setError(
      data?.detail ||
      data?.error ||
      data?.non_field_errors?.join(" ") ||
      "Failed to link guardian to student."
    );
  } finally {
    setSaving(false);
  }
};
// Handle input changes
const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

  // Delete relationship
  const handleDelete = async () => {
  if (!deleteRelationship) return;

  setDeleting(deleteRelationship.id);
  setError("");

  try {
    await api.delete(
      `students/${deleteRelationship.student}/guardians/`,
      {
        data: {
          guardian: deleteRelationship.guardian,
        },
      }
    );

    setRelationships((prev) =>
      prev.filter(
        (item) => item.id !== deleteRelationship.id
      )
    );

    setSuccess("Guardian relationship removed successfully.");
    setDeleteRelationship(null);

  } catch (err) {
    setError(
      err.response?.data?.detail ||
      err.response?.data?.error ||
      "Failed to remove guardian relationship."
    );
  } finally {
    setDeleting(null);
  }
};

  const getStudentName = (id) => {
    const student = students.find(
      (item) => String(item.id) === String(id)
    );

    if (!student) return `Student #${id}`;

    return student.full_name ||
      `${student.first_name || ""} ${student.last_name || ""}`.trim();
  };

  const getGuardianName = (id) => {
    const guardian = guardians.find(
      (item) => String(item.id) === String(id)
    );

    return guardian?.full_name || `Guardian #${id}`;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Student-Guardian Relationships
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Link parents and guardians to registered students.
        </p>
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
          {success}

          <button onClick={() => setSuccess("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="mb-3 text-blue-600" size={25} />

          <p className="text-sm text-slate-500">
            Total Students
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {students.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <UserRound className="mb-3 text-purple-600" size={25} />

          <p className="text-sm text-slate-500">
            Total Guardians
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {guardians.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link2 className="mb-3 text-green-600" size={25} />

          <p className="text-sm text-slate-500">
            Active Relationships
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {relationships.length}
          </h2>
        </div>

      </div>

      {/* Link Guardian Form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b border-slate-200 p-5">

          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Link2 size={23} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Link Guardian to Student
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Create a new guardian-student relationship.
            </p>
          </div>

        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Student */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Student *
              </label>

              <select
                name="student"
                value={formData.student}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Choose a student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {getStudentName(student.id)} - {student.admission_number}
                  </option>
                ))}
              </select>
            </div>

            {/* Guardian */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Guardian *
              </label>

              <select
                name="guardian"
                value={formData.guardian}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Choose a guardian</option>

                {guardians.map((guardian) => (
                  <option key={guardian.id} value={guardian.id}>
                    {guardian.full_name} - {guardian.phone_number}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Primary Guardian */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">

            <input
              type="checkbox"
              name="is_primary"
              checked={formData.is_primary}
              onChange={handleChange}
              className="h-4 w-4 rounded accent-blue-600"
            />

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Set as Primary Guardian
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Mark this person as the primary guardian for this student.
              </p>
            </div>

          </label>

          <div className="flex justify-end">

            <button
              type="submit"
              disabled={saving || loading || !students.length || !guardians.length}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Link Guardian
                </>
              )}
            </button>

          </div>

        </form>

      </div>

      {/* Relationships Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 p-5">

          <div>
            <h2 className="font-bold text-slate-800">
              Linked Guardians
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              All existing student-guardian relationships.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Guardian</th>
                <th className="px-6 py-4">Primary</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr>
                  <td colSpan="4" className="py-12 text-center">
                    <Loader2
                      size={27}
                      className="mx-auto animate-spin text-blue-600"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading relationships...
                    </p>
                  </td>
                </tr>

              ) : relationships.length === 0 ? (

                <tr>
                  <td colSpan="4" className="py-12 text-center">

                    <Users
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-medium text-slate-600">
                      No relationships found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Start by linking a guardian to a student.
                    </p>

                  </td>
                </tr>

              ) : (

                relationships.map((item) => (

                  <tr key={item.id} className="hover:bg-slate-50">

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {getStudentName(item.student)}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.guardian_name || getGuardianName(item.guardian)}
                      </p>

                      <p className="text-xs text-slate-400">
                        {item.guardian_phone || ""}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">

                      {item.is_primary ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Primary
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Secondary
                        </span>
                      )}

                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">

                      <button
                        onClick={() => setDeleteRelationship(item)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Remove relationship"
                      >
                        <Trash2 size={17} />
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* Delete Confirmation */}
      {deleteRelationship && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <h2 className="text-lg font-bold text-slate-800">
              Remove Guardian Relationship
            </h2>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to remove{" "}
              <strong>{getGuardianName(deleteRelationship.guardian)}</strong>
              {" "}from{" "}
              <strong>{getStudentName(deleteRelationship.student)}</strong>?
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setDeleteRelationship(null)}
                disabled={deleting !== null}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting !== null}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting === deleteRelationship.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove
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

export default StudentGuardian;
