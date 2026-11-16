
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

import api from "../context/api/api";

const StudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await api.get(`students/${id}/`);
        const student = response.data;

        setForm({
          admission_number: student.admission_number || "",
          first_name: student.first_name || "",
          last_name: student.last_name || "",
          other_names: student.other_names || "",
          date_of_birth: student.date_of_birth || "",
          gender: student.gender || "",
        });

      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Unable to retrieve student information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      await api.patch(`students/${id}/`, {
        ...form,
        date_of_birth: form.date_of_birth || null,
      });

      navigate(`/students/${id}`, {
        state: {
          success: "Student updated successfully.",
        },
      });

    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.detail || "Please correct the errors below."
      );

      if (data && typeof data === "object") {
        setFieldErrors(data);
      }

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={30} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="rounded-lg bg-red-50 p-5 text-sm text-red-600">
        {error || "Student not found."}
      </div>
    );
  }

  const fields = [
    ["admission_number", "Admission Number"],
    ["first_name", "First Name"],
    ["last_name", "Last Name"],
    ["other_names", "Other Names"],
  ];

  return (
    <div className="space-y-6">

      <button
        onClick={() => navigate(`/students/${id}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Student
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Edit Student
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update student registration information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {fields.map(([name, label]) => (
            <div key={name}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {label}
              </label>

              <input
                name={name}
                value={form[name]}
                onChange={handleChange}
                required={name !== "other_names"}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              {fieldErrors[name] && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors[name]}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date of Birth
            </label>

            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Gender
            </label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t pt-5">

          <button
            type="button"
            onClick={() => navigate(`/students/${id}`)}
            className="rounded-lg border border-slate-200 px-5 py-3 text-sm text-slate-600"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </form>
    </div>
  );
};

export default StudentEdit;
