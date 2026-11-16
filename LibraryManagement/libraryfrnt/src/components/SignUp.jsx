
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Library,
  Sparkles,
  CheckCircle,
} from "lucide-react";
// import api from "../api/axios";
import api from "./context/api/api";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validate fields
    if (
      !formData.username ||
      !formData.email ||
      !formData.phone_number ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Send registration request
      const response = await api.post("core/register/", {
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
      });

      console.log("Registration successful:", response.data);

      setSuccess("Account created successfully! Redirecting to login...");

      // Redirect to login after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 1800);

    } catch (err) {
      console.error("Registration error:", err);

      const data = err.response?.data;

      if (data) {
        const message =
          data.detail ||
          data.message ||
          Object.entries(data)
            .map(([field, messages]) =>
              `${field}: ${
                Array.isArray(messages)
                  ? messages.join(", ")
                  : messages
              }`
            )
            .join(" | ");

        setError(
          message || "Registration failed. Please try again."
        );
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f5f7f4]">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#153c32]">

        <div className="absolute inset-0 bg-gradient-to-br from-[#153c32] via-[#194b3d] to-[#0c2923]" />

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col justify-between p-14 xl:p-20 w-full">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#d5a85e] flex items-center justify-center">
              <BookOpen size={27} className="text-[#153c32]" />
            </div>

            <div>
              <h1 className="text-white text-2xl font-bold tracking-wide">
                Libri
              </h1>

              <p className="text-green-100/60 text-xs tracking-[3px] uppercase">
                Library Management
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-lg">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[#e5bd7c] text-sm mb-8">
              <Sparkles size={15} />
              Begin your reading journey
            </div>

            <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
              Join our
              <br />
              community of
              <br />
              <span className="text-[#d5a85e]">
                readers.
              </span>
            </h2>

            <p className="text-green-100/70 text-lg leading-8 max-w-md">
              Create your account and unlock a world of
              knowledge. Discover books, manage your
              reading journey, and connect with the
              library community.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-5">

              {[
                "Access a world of books",
                "Manage your borrowing activities",
                "Keep track of your reading journey",
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-green-50/80"
                >
                  <div className="w-7 h-7 rounded-full bg-[#d5a85e]/20 flex items-center justify-center">
                    <CheckCircle
                      size={16}
                      className="text-[#d5a85e]"
                    />
                  </div>

                  <span className="text-sm">{feature}</span>
                </div>
              ))}

            </div>
          </div>

          {/* Footer */}
          <p className="text-green-100/40 text-sm">
            © {new Date().getFullYear()} Libri Library Management System.
            All rights reserved.
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 sm:px-12">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">

            <div className="w-12 h-12 rounded-xl bg-[#153c32] flex items-center justify-center">
              <BookOpen size={26} className="text-[#d5a85e]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#153c32]">
                Libri
              </h1>

              <p className="text-gray-500 text-xs tracking-widest uppercase">
                Library Management
              </p>
            </div>

          </div>

          {/* Heading */}
          <div className="mb-7">

            <div className="w-14 h-14 rounded-2xl bg-[#e6eee8] flex items-center justify-center mb-5">
              <Library size={28} className="text-[#153c32]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>

            <p className="text-gray-500">
              Join Libri and start your reading journey.
            </p>

          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="0712345678"
                  autoComplete="tel"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#153c32]"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Use at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#153c32]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full flex items-center justify-center gap-3 bg-[#153c32] hover:bg-[#225543] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-900/10 hover:shadow-xl mt-3"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={19} />
                </>
              )}
            </button>

          </form>

          {/* Login link */}
          <div className="mt-7 text-center">

            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#285b48] font-bold hover:underline"
              >
                Sign In
              </Link>
            </p>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock size={13} />
              Your information is securely protected.
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SignUp;
