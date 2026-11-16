
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Pencil,
  UserRound,
  Phone,
  Mail,
  Users,
  Loader2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

import api from "../context/api/api";

const GuardianDetails = () => {
  const { id } = useParams();

  const [guardian, setGuardian] = useState(null);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const [guardianResponse, relationshipResponse] =
          await Promise.all([
            api.get(`guardians/${id}/`),
            api.get(`student-guardians/?guardian=${id}`),
          ]);

        setGuardian(guardianResponse.data);

        const data = relationshipResponse.data;

        const relationships = Array.isArray(data)
          ? data
          : data?.results || [];

        setStudents(relationships);

      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Failed to load guardian details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !guardian) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <AlertCircle className="mb-2" />
        {error || "Guardian not found."}

        <Link
          to="/guardians"
          className="mt-3 block font-semibold underline"
        >
          Return to guardians
        </Link>
      </div>
    );
  }

  const initials = guardian.full_name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="flex items-center gap-3">

          <Link
            to="/guardians"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Guardian Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View guardian information and linked students.
            </p>
          </div>

        </div>

        <Link
          to={`/guardians/${id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Pencil size={17} />
          Edit Guardian
        </Link>

      </div>

      {/* Profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col items-center gap-4 sm:flex-row">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {initials || "GU"}
          </div>

          <div className="text-center sm:text-left">

            <h2 className="text-xl font-bold text-slate-800">
              {guardian.full_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Guardian ID: {guardian.id}
            </p>

            <span className="mt-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              {guardian.relationship || "Relationship not specified"}
            </span>

          </div>

        </div>

      </div>

      {/* Contact Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="font-bold text-slate-800">
          Contact Information
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Phone size={21} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Phone Number
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {guardian.phone_number || "Not provided"}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <Mail size={21} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Email Address
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {guardian.email || "Not provided"}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CalendarDays size={21} />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Date Registered
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {guardian.created_at
                  ? new Date(guardian.created_at).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Associated Students */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 p-5">

          <div>
            <h2 className="font-bold text-slate-800">
              Associated Students
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Students linked to this guardian.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {students.length} Student(s)
          </span>

        </div>

        {students.length === 0 ? (

          <div className="py-12 text-center">

            <Users
              size={35}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-600">
              No students linked
            </p>

            <p className="mt-1 text-sm text-slate-400">
              This guardian has not been linked to any student.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Relationship</th>
                  <th className="px-6 py-4">Primary Guardian</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {students.map((relationship) => (

                  <tr key={relationship.id}>

                    <td className="px-6 py-4">

                      <Link
                        to={`/students/${relationship.student}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Student ID: {relationship.student}
                      </Link>

                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {guardian.relationship || "—"}
                    </td>

                    <td className="px-6 py-4">

                      {relationship.is_primary ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Primary
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Secondary
                        </span>
                      )}

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

export default GuardianDetails;
