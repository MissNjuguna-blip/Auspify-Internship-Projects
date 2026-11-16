
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";

import api from "../context/api/api";

const StudentRegister = () => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    other_names: "",
    date_of_birth: "",
    gender: "",
  });

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
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
      };

      await api.post("students/", payload);

      navigate("/students", {
        state: {
          success: "Student registered successfully.",
        },
      });

    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        setFieldErrors(data);
        setError(
          data.detail ||
          "Please correct the errors below."
        );
      } else {
        setError("Unable to register student.");
      }

    } finally {
      setSaving(false);
    }
  };

  const fields = [
    {
      name: "admission_number",
      label: "Admission Number",
      placeholder: "Enter admission number",
      required: true,
    },
    {
      name: "first_name",
      label: "First Name",
      placeholder: "Enter first name",
      required: true,
    },
    {
      name: "last_name",
      label: "Last Name",
      placeholder: "Enter last name",
      required: true,
    },
    {
      name: "other_names",
      label: "Other Names",
      placeholder: "Enter other names",
      required: false,
    },
  ];

  return (
    <div className="space-y-6">

      <button
        onClick={() => navigate("/students")}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Students
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Register Student
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Add a new student to your institution.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >

        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <UserPlus size={23} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-800">
              Student Information
            </h2>

            <p className="text-xs text-slate-500">
              Enter the student's personal and admission details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {fields.map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {field.label}
                {field.required && (
                  <span className="text-red-500"> *</span>
                )}
              </label>

              <input
                type="text"
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {fieldErrors[field.name] && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors[field.name]}
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

            {fieldErrors.date_of_birth && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.date_of_birth}
              </p>
            )}
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
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">

          <button
            type="button"
            onClick={() => navigate("/students")}
            className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Register Student
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
};

export default StudentRegister;
