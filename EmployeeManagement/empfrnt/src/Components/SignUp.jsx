
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./context/api/api";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("core/auth/register/", {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password,
      });

      setSuccess(response.data.message);

      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone_number: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition focus:border-[#A8ED3D] focus:ring-4 focus:ring-[#B7FF4A]/20";

  return (
    <div className="min-h-screen bg-[#F1EDFF] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#C9B6FF] rounded-full blur-3xl opacity-40" />

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#B7FF4A] rounded-full blur-3xl opacity-30" />

      <div className="w-full max-w-5xl bg-[#19192D] rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 relative z-10">

        {/* Left section */}
        <div className="hidden md:flex flex-col justify-between p-12 text-white">

          <div>
            <div className="flex items-center gap-3">
              <div className="bg-[#B7FF4A] text-[#19192D] p-3 rounded-xl">
                <span className="text-2xl font-bold">P</span>
              </div>

              <h1 className="text-2xl font-bold">
                PeopleFlow
              </h1>
            </div>

            <div className="mt-24">
              <p className="text-[#B7FF4A] uppercase tracking-[0.3em] text-xs font-bold">
                Employee Management
              </p>

              <h2 className="text-5xl font-bold mt-5 leading-tight">
                Build your
                <span className="text-[#B7FF4A]"> team.</span>
                <br />
                Manage your
                <span className="text-[#C9B6FF]"> future.</span>
              </h2>

              <p className="text-gray-400 mt-6 leading-7">
                Create your administrator account and
                start managing your organization's
                employees, departments and attendance.
              </p>
            </div>
          </div>

          <div className="text-gray-500 text-sm">
            © 2026 PeopleFlow. All rights reserved.
          </div>
        </div>

        {/* Right section */}
        <div className="bg-white p-8 sm:p-10">

          <div className="mb-7">
            <div className="md:hidden flex items-center gap-2 mb-6">
              <div className="bg-[#B7FF4A] p-2 rounded-lg font-bold">
                P
              </div>
              <span className="font-bold text-xl text-[#19192D]">
                PeopleFlow
              </span>
            </div>

            <p className="text-[#8C79BD] font-semibold text-sm uppercase tracking-widest">
              Create Account
            </p>

            <h2 className="text-3xl font-bold text-[#19192D] mt-2">
              Get started!
            </h2>

            <p className="text-gray-500 mt-2 text-sm">
              Create your administrator account.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>

                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>

                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>

            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username *
              </label>

              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                autoComplete="username"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`${inputClass} pr-16`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8C79BD] font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-3 text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B7FF4A] hover:bg-[#A6EE36] disabled:opacity-60 text-[#19192D] font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-lime-200"
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#8C79BD] font-bold hover:text-[#19192D]"
            >
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default SignUp;
