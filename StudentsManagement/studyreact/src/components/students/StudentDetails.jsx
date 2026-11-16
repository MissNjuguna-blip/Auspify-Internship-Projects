
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import {
  ArrowLeft,
  Pencil,
  UserRound,
  CalendarDays,
  GraduationCap,
  Hash,
  Loader2,
} from "lucide-react";

import api from "../context/api/api";

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await api.get(`students/${id}/`);
        setStudent(response.data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Unable to load student information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={30} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-lg bg-red-50 p-5 text-red-600">
        {error || "Student not found."}
      </div>
    );
  }

  const information = [
    {
      label: "Admission Number",
      value: student.admission_number,
      icon: Hash,
    },
    {
      label: "First Name",
      value: student.first_name,
      icon: UserRound,
    },
    {
      label: "Last Name",
      value: student.last_name,
      icon: UserRound,
    },
    {
      label: "Other Names",
      value: student.other_names,
      icon: UserRound,
    },
    {
      label: "Date of Birth",
      value: student.date_of_birth,
      icon: CalendarDays,
    },
    {
      label: "Gender",
      value: student.gender,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Students
        </button>

        <button
          onClick={() => navigate(`/students/${id}/edit`)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Pencil size={16} />
          Edit Student
        </button>

      </div>

      {location.state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {location.state.success}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center gap-5 bg-gradient-to-r from-blue-700 to-blue-500 p-7 text-white">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <UserRound size={40} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              {student.full_name}
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Admission No: {student.admission_number}
            </p>
          </div>

        </div>

        <div className="p-6">

          <h2 className="mb-5 font-semibold text-slate-800">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {information.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-blue-600">
                    <Icon size={17} />
                    <span className="text-xs font-medium text-slate-500">
                      {item.label}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {item.value || "Not provided"}
                  </p>
                </div>
              );
            })}

          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2">

            <div>
              <p className="text-xs text-slate-500">
                Registration Date
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {student.created_at
                  ? new Date(student.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Last Updated
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {student.updated_at
                  ? new Date(student.updated_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDetails;
