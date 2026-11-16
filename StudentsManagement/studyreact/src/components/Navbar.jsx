import { useLocation } from "react-router-dom";

import {
  Menu,
  Bell,
  Search,
  UserCircle,
  LogOut,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";

const Navbar = ({ openSidebar }) => {
  const location = useLocation();

  // Match the names exported by AuthContext
  const { user, Logout } = useAuth();

  const getPageTitle = () => {
    const titles = {
      "/dashboard": "Dashboard",
      "/students": "Students",
      "/students/register": "Register Student",
      "/academics": "Academics",
      "/academics/academic-years": "Academic Years",
      "/academics/terms": "Terms",
      "/academics/classrooms": "Classrooms",
      "/academics/subjects": "Subjects",
      "/academics/enrollments": "Enrollments",
      "/attendance": "Attendance",
      "/examinations": "Examinations",
      "/finance": "Finance",
      "/staff": "Staff",
      "/settings": "Settings",
    };

    return (
      titles[location.pathname] ||
      (location.pathname.includes("/students/")
        ? "Student Details"
        : "School Management")
    );
  };

  const handleLogout = () => {
    try {
      Logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">

        <button
          onClick={openSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {getPageTitle()}
          </h2>

          <p className="hidden text-xs text-slate-400 sm:block">
            Welcome to your school management system
          </p>
        </div>

      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">

        <button
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block"
          title="Search"
        >
          <Search size={20} />
        </button>

        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          title="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* USER PROFILE */}
        <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">

          <UserCircle size={34} className="text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {user?.username ||
                user?.first_name ||
                "Administrator"}
            </p>

            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>

        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        >
          <LogOut size={19} />
        </button>

      </div>

    </header>
  );
};

export default Navbar;
