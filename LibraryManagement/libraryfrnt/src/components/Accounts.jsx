import React, { useState, useEffect } from "react";
import api from "./context/api/api";


const Accounts = () => {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "register" | "profile" | "password" | "users"

  // Form States
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", first_name: "", last_name: "" });
  const [profileData, setProfileData] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "", confirm_password: "" });

  // Admin Users List State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fetch Current User Profile
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("accounts/me/");
      setProfileData(res.data);
    } catch (err) {
      setError("Failed to load profile. Ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Admin Users List
  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const params = userSearch ? { search: userSearch } : {};
      const res = await api.get("accounts/users/", { params });
      setUsersList(res.data.results || res.data);
    } catch (err) {
      setError("Failed to load users. Staff permission required.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "profile") fetchProfile();
    if (activeTab === "users") fetchUsersList();
  }, [activeTab, userSearch]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.post("accounts/login/", loginForm);
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setMessage("Logged in successfully! Access token saved.");
      setActiveTab("profile");
    } catch (err) {
      setError("Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.post("accounts/register/", registerForm);
      setMessage("Account registered successfully! Please log in.");
      setActiveTab("login");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.patch("accounts/me/", profileData);
      setProfileData(res.data);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.post("accounts/change-password/", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setMessage("Password changed successfully!");
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Failed to change password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          Accounts & Authentication
        </h1>
        <p className="text-sm text-gray-500">
          Manage user sessions, profile details, credentials, and staff user control.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "login", label: "Log In" },
          { id: "register", label: "Register" },
          { id: "profile", label: "My Profile" },
          { id: "password", label: "Change Password" },
          { id: "users", label: "Admin Users (Staff)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(null); setMessage(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#153c32] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback Banners */}
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
      {message && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{message}</div>}

      {/* TAB 1: LOGIN */}
      {activeTab === "login" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-[#153c32] mb-6" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Sign In to Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#153c32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#153c32] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#153c32] text-white rounded-xl text-sm font-bold hover:bg-[#225543] transition shadow"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: REGISTER */}
      {activeTab === "register" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-[#153c32] mb-6" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Create Account</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={registerForm.first_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={registerForm.last_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#153c32] text-white rounded-xl text-sm font-bold hover:bg-[#225543] transition shadow"
            >
              {loading ? "Registering..." : "Register Account"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MY PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-[#153c32] mb-6" style={{ fontFamily: '"Times New Roman", Times, serif' }}>My Profile</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={profileData.first_name || ""}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileData.last_name || ""}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username (Read-only)</label>
              <input
                type="text"
                disabled
                value={profileData.username || ""}
                className="w-full border bg-gray-50 rounded-xl p-3 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileData.email || ""}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#153c32] text-white rounded-xl text-sm font-bold hover:bg-[#225543] transition shadow"
            >
              {loading ? "Saving..." : "Update Profile"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: CHANGE PASSWORD */}
      {activeTab === "password" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-[#153c32] mb-6" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#153c32] text-white rounded-xl text-sm font-bold hover:bg-[#225543] transition shadow"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: ADMIN USERS VIEWSET */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Staff User Accounts Directory</h2>
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Username</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Staff Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-400">Loading users...</td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-400">No user records found.</td></tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono font-medium text-gray-900">{u.username}</td>
                      <td className="p-4">{u.first_name} {u.last_name}</td>
                      <td className="p-4 text-gray-500">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${u.is_staff ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.is_staff ? "Staff / Admin" : "Standard User"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;