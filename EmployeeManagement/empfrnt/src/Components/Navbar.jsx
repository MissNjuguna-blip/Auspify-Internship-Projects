
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BriefcaseBusiness,
  Menu,
  LogOut,
  UserCircle,
  ChevronDown,
  Bell,
  X,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";

const Navbar = ({ openSidebar }) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }

      setProfileOpen(false);
      navigate("/login", { replace: true });

    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white shadow-sm">

      <div className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* LEFT SIDE */}

        <div className="flex min-w-0 items-center gap-3">

          {/* MOBILE SIDEBAR BUTTON */}

          <button
            type="button"
            onClick={openSidebar}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          {/* BRAND */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#269653] shadow-sm">
              <BriefcaseBusiness
                size={22}
                className="text-white"
              />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight text-gray-800">
                People<span className="text-[#269653]">Hub</span>
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
                Employee Management
              </p>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">

          {/* NOTIFICATIONS */}

          <button
            type="button"
            className="relative rounded-xl p-2.5 text-gray-500 transition hover:bg-gray-100"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-green-500" />
          </button>

          {/* PROFILE */}

          <div className="relative">

            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-gray-50"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0EAFE]">
                <UserCircle
                  size={23}
                  className="text-[#7954B8]"
                />
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-gray-800">
                  {user?.username || user?.first_name || "Administrator"}
                </p>

                <p className="text-xs text-gray-400">
                  Administrator
                </p>
              </div>

              <ChevronDown
                size={16}
                className="hidden text-gray-400 sm:block"
              />

            </button>

            {/* PROFILE DROPDOWN */}

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />

                <div className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">

                  <div className="mb-2 border-b border-gray-100 px-3 py-3">

                    <p className="truncate text-sm font-semibold text-gray-800">
                      {user?.username || "Administrator"}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {user?.email || "Employee System"}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>

                </div>
              </>
            )}

          </div>

        </div>

      </div>

    </header>
  );
};

export default Navbar;
