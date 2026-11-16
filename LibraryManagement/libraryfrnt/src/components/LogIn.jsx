
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Library,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
// import api from "../api/axios"; // Adjust path to your axios file
import api from "./context/api/api";
import { AuthContext } from "./context/AuthContext";

const LogIn = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

    
    const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim() || !formData.password) {
        setError("Please enter your username and password.");
        return;
    }

    try {
        setLoading(true);

        const response = await api.post("core/login/", {
        username: formData.username.trim(),
        password: formData.password,
        });

        // Get tokens from Django
        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh;

        // Verify successful authentication
        if (!accessToken || !refreshToken) {
        setError("Login failed. Authentication tokens missing.");
        return;
        }

        // Update authentication context
        setToken(accessToken);
        setUser(response.data.user);

        // Save refresh token
        localStorage.setItem("refresh_token", refreshToken);

        // Navigate to dashboard
        navigate("/dashboard", { replace: true });

    } catch (err) {
        console.error("Login error:", err);

        setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Invalid username or password."
        );

    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="min-h-screen flex bg-[#f5f7f4]">

      {/* LEFT SECTION */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#153c32] overflow-hidden">

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

          {/* Main content */}
          <div className="max-w-lg">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[#e5bd7c] text-sm mb-8">
              <Sparkles size={15} />
              Your world of knowledge
            </div>

            <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
              Discover.
              <br />
              Read.
              <br />
              <span className="text-[#d5a85e]">
                Grow.
              </span>
            </h2>

            <p className="text-green-100/70 text-lg leading-8 max-w-md">
              Manage your library, explore thousands of books,
              and make knowledge accessible to everyone.
              Your next great read starts here.
            </p>

            {/* Book illustration */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {["#d5a85e", "#b7c8a7", "#c47c55", "#e7dfca"].map(
                  (color, index) => (
                    <div
                      key={index}
                      className="w-12 h-16 rounded-md border-2 border-[#153c32] shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>

              <div>
                <p className="text-white font-semibold">
                  A world of possibilities
                </p>
                <p className="text-green-100/50 text-sm">
                  Every book tells a story.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-green-100/40 text-sm">
            © {new Date().getFullYear()} Libri Library Management System.
            All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:px-12">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
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

          <div className="mb-10">
            <div className="w-14 h-14 rounded-2xl bg-[#e6eee8] flex items-center justify-center mb-6">
              <Library size={28} className="text-[#153c32]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Welcome back!
            </h2>

            <p className="text-gray-500">
              Sign in to access your library dashboard.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>

              <div className="relative">
                <User
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
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
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 bg-white outline-none transition-all focus:border-[#285b48] focus:ring-4 focus:ring-[#285b48]/10 text-gray-800 placeholder:text-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#153c32]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#285b48]"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#285b48] hover:text-[#153c32]"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#153c32] hover:bg-[#225543] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-900/10 hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#285b48] font-bold hover:underline"
              >
                Create account
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock size={13} />
              Secure Library Management Portal
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LogIn;
