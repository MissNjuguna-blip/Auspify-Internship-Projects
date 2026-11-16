
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  UserRound,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import api from "../context/api/api";

const GuardianForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    relationship: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch guardian when editing
  useEffect(() => {
    if (!isEditing) return;

    const fetchGuardian = async () => {
      setFetching(true);
      setError("");

      try {
        const response = await api.get(`students/guardians/${id}/`);

        setFormData({
          full_name: response.data.full_name || "",
          phone_number: response.data.phone_number || "",
          email: response.data.email || "",
          relationship: response.data.relationship || "",
        });

      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Failed to load guardian information."
        );
      } finally {
        setFetching(false);
      }
    };

    fetchGuardian();
  }, [id, isEditing]);

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.full_name.trim()) {
      setError("Guardian full name is required.");
      return;
    }

    if (!formData.phone_number.trim()) {
      setError("Phone number is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim(),
        relationship: formData.relationship.trim(),
      };

      if (isEditing) {
        await api.put(`students/guardians/${id}/`, payload);
        setSuccess("Guardian updated successfully.");
      } else {
        await api.post("students/guardians/", payload);
        setSuccess("Guardian registered successfully.");
      }

      navigate("/guardians", {
        state: {
          success: isEditing
            ? "Guardian updated successfully."
            : "Guardian registered successfully.",
        },
      });

    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(" ")
              : String(value);

            return `${field}: ${message}`;
          })
          .join(" ");

        setError(messages || "Failed to save guardian.");
      } else {
        setError("Failed to save guardian. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">

        <Link
          to="/guardians"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? "Edit Guardian" : "Register Guardian"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? "Update guardian information."
              : "Enter the details of a new parent or guardian."}
          </p>
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
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >

        {/* Form Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">

          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <UserRound size={25} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Guardian Information
            </h2>

            <p className="text-xs text-slate-500">
              Personal and contact details
            </p>
          </div>

        </div>

        <div className="space-y-5 p-6">

          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter guardian's full name"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>

              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+254 7XX XXX XXX"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* Relationship */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Relationship to Student
            </label>

            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select relationship</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
              <option value="Uncle">Uncle</option>
              <option value="Aunt">Aunt</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row">

          <Link
            to="/guardians"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                {isEditing ? "Update Guardian" : "Register Guardian"}
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
};

export default GuardianForm;
