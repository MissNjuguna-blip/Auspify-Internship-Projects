
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  FileChartColumn,
  BriefcaseBusiness,
  UsersRound,
  Wallet,
  MessageSquare,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  School,
  X,
} from "lucide-react";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "ACADEMIC MANAGEMENT",
    items: [
      {
        name: "Students",
        icon: Users,
        children: [
          { name: "All Students", path: "/students" },
          { name: "Register Student", path: "/students/register" },
        ],
      },
      {
        name: "Academics",
        icon: GraduationCap,
        children: [
          { name: "Academic Overview", path: "/academics" },
          { name: "Academic Years", path: "/academics/academic-years" },
          { name: "Terms", path: "/academics/terms" },
          { name: "Classes", path: "/academics/classrooms" },
          { name: "Subjects", path: "/academics/subjects" },
          { name: "Departments", path: "/academics/departments" },
        ],
      },
    ],
  },
  {
    title: "SCHOOL OPERATIONS",
    items: [
      {
        name: "Guardians",
        icon: UsersRound,
        children: [
          { name: "All Guardians", path: "/guardians" },
          { name: "Register Guardian", path: "/guardians/register" },
          { name: "Student Guardians", path: "/student-guardians" },
        ],
      },
      {
        name: "Staff",
        icon: BriefcaseBusiness,
        children: [
          { name: "Register Staff", path: "/staff/register" },
          { name: "Staff Details", path: "/staff/1" },
          { name: "Staff Attendance", path: "/staff/attendance" },
          { name: "Staff Finance", path: "/staff/finance" },
        ],
      },
      {
        name: "Finance",
        icon: Wallet,
        children: [
          { name: "Finance Overview", path: "/finance" },
        ],
      },
    ],
  },
];
const Sidebar = ({
  isOpen = false,
  onClose = () => {},
  // onLogout = () => {},
  user = null,
}) => {
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState({
    Students: true,
  });

  const toggleMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const isChildActive = (children = []) =>
    children.some((child) => location.pathname === child.path);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-900 text-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-700 px-5">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <GraduationCap size={27} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide">
                EduManage
              </h1>

              <p className="text-xs text-slate-400">
                School Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X size={21} />
          </button>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">

          {navigation.map((section) => (
            <div key={section.title}>

              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.15em] text-slate-500">
                {section.title}
              </p>

              <div className="space-y-1">

                {section.items.map((item) => {
                  const Icon = item.icon;

                  const hasChildren = Boolean(item.children);

                  const expanded = Boolean(
                    expandedMenus[item.name]
                  );

                  const active = hasChildren
                    ? isChildActive(item.children)
                    : location.pathname === item.path;

                  return (
                    <div key={item.name}>

                      {/* Parent Menu */}
                      {hasChildren ? (
                        <button
                          onClick={() => toggleMenu(item.name)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            active
                              ? "bg-slate-800 text-white"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon size={19} />
                            {item.name}
                          </span>

                          {expanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      ) : (
                        <NavLink
                          to={item.path}
                          onClick={onClose}
                          className={linkClass}
                        >
                          <Icon size={19} />
                          {item.name}
                        </NavLink>
                      )}

                      {/* Submenus */}
                      {hasChildren && expanded && (
                        <div className="ml-5 mt-1 space-y-1 border-l border-slate-700 pl-4">

                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `block rounded-md px-3 py-2 text-xs transition ${
                                  isActive
                                    ? "bg-blue-600/20 font-semibold text-blue-400"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`
                              }
                            >
                              {child.name}
                            </NavLink>
                          ))}

                        </div>
                      )}

                    </div>
                  );
                })}

              </div>
            </div>
          ))}

        </nav>

        {/* User Profile */}
        <div className="shrink-0 border-t border-slate-700 p-4">

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold uppercase">
              {user?.username?.charAt(0) || "A"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.username || "Administrator"}
              </p>

              <p className="truncate text-xs text-slate-400">
                {user?.email || "School Admin"}
              </p>
            </div>
          </div>

          {/* <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Sign Out
          </button> */}

        </div>

      </aside>
    </>
  );
};

export default Sidebar;
