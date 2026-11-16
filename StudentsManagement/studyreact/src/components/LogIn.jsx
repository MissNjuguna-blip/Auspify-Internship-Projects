import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import {
  GraduationCap,
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

import api from "./context/api/api";
import { useAuth } from "./context/AuthContext";

const LogIn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get authentication functions from AuthContext
  const { setToken, setUser } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.message || ""
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.username.trim() || !formData.password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("core/login/", {
        username: formData.username.trim(),
        password: formData.password,
      });

      const {
        user,
        access_token,
        refresh,
        message,
      } = response.data;

      if (!access_token || !user) {
        throw new Error("Invalid login response from server.");
      }

      // Save tokens
      localStorage.setItem("access_token", access_token);

      if (refresh) {
        localStorage.setItem("refresh_token", refresh);
      }

      // Update AuthContext
      setToken(access_token);
      setUser(user);

      // Configure Axios
      api.defaults.headers.common["Authorization"] =
        `Bearer ${access_token}`;

      setSuccess(message || "Login successful!");

      // Navigate to dashboard
      const destination =
        location.state?.from?.pathname || "/dashboard";

      navigate(destination, { replace: true });

    } catch (err) {
      console.error("Login error:", err);

      const data = err.response?.data;

      setError(
        data?.error ||
        data?.detail ||
        err.message ||
        "Unable to log in. Please check your credentials."
      );

    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">

      <div className="w-full max-w-md">

        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <GraduationCap size={30} />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            EduManage
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Student Management System
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-800">
              Welcome Back!
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

          </form>

          <div className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Create Account
            </Link>
          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} EduManage. All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default LogIn;
