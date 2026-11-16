
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useAuth } from "./context/AuthContext";
// import { useAuth } from "./context/AuthContext";

const LogIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      await login({
        username: username.trim(),
        password,
      });

      setCountdown(3);

      // Redirect after successful login
      let remaining = 3;

      const timer = setInterval(() => {
        remaining -= 1;

        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(timer);
          navigate("/dashboard", { replace: true });
        }
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed. Please check your credentials."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EDFF] flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#C9B6FF] rounded-full blur-3xl opacity-40" />

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#B7FF4A] rounded-full blur-3xl opacity-30" />

      <div className="w-full max-w-5xl bg-[#19192D] rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 relative z-10">

        {/* Left section */}
        <div className="hidden md:flex flex-col justify-between p-12 text-white relative overflow-hidden">

          <div>
            <div className="flex items-center gap-3">
              <div className="bg-[#B7FF4A] text-[#19192D] p-3 rounded-xl">
                <span className="text-2xl font-bold">P</span>
              </div>

              <h1 className="text-2xl font-bold tracking-wide">
                PeopleFlow
              </h1>
            </div>

            <div className="mt-24">
              <p className="text-[#B7FF4A] uppercase tracking-[0.3em] text-xs font-bold">
                Employee Management
              </p>

              <h2 className="text-5xl font-bold mt-5 leading-tight">
                Manage your
                <span className="text-[#B7FF4A]"> people.</span>
                <br />
                Grow your
                <span className="text-[#C9B6FF]"> business.</span>
              </h2>

              <p className="text-gray-400 mt-6 leading-7">
                Your centralized workspace for managing
                employees, departments, attendance and
                organizational performance.
              </p>
            </div>
          </div>

          <div className="text-gray-500 text-sm">
            © 2026 PeopleFlow. All rights reserved.
          </div>
        </div>

        {/* Right section */}
        <div className="bg-white p-8 sm:p-12 flex flex-col justify-center">

          <div className="mb-8">
            <div className="md:hidden flex items-center gap-2 mb-8">
              <div className="bg-[#B7FF4A] p-2 rounded-lg font-bold">
                P
              </div>

              <span className="font-bold text-xl text-[#19192D]">
                PeopleFlow
              </span>
            </div>

            <p className="text-[#8C79BD] font-semibold text-sm uppercase tracking-widest">
              Admin Portal
            </p>

            <h2 className="text-3xl font-bold text-[#19192D] mt-3">
              Welcome back!
            </h2>

            <p className="text-gray-500 mt-2">
              Sign in to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
                disabled={loading || countdown !== null}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition focus:border-[#A8ED3D] focus:ring-4 focus:ring-[#B7FF4A]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading || countdown !== null}
                  className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 outline-none transition focus:border-[#A8ED3D] focus:ring-4 focus:ring-[#B7FF4A]/20"
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

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {countdown !== null && (
              <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle size={18} />
                  Login successful!
                </div>

                <p className="mt-1">
                  Welcome back! Redirecting in {countdown} seconds.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || countdown !== null}
              className="w-full bg-[#B7FF4A] hover:bg-[#A6EE36] disabled:opacity-60 text-[#19192D] font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-lime-200"
            >
              {loading
                ? "Verifying credentials..."
                : countdown !== null
                ? `Redirecting in ${countdown}...`
                : "Sign In →"}
            </button>

          </form>

          <div className="mt-8 text-center text-xs text-gray-400">
            Protected administrator access.
          </div>

          <div className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Create account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LogIn;
