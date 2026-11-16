
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarDays,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      label: "OVERVIEW",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      ],
    },
    {
      label: "PEOPLE MANAGEMENT",
      items: [
        { name: "Employees", icon: Users, href: "/employees" },
        { name: "Departments", icon: Building2, href: "/departments" },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        { name: "Attendance", icon: CalendarCheck, href: "/attendance" },
        { name: "Leave Management", icon: CalendarDays, href: "/leaves" },
        { name: "Payroll", icon: Wallet, href: "/payroll" },
      ],
    },
    {
      label: "INSIGHTS",
      items: [
        { name: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
      ],
    },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === "/" ||
        location.pathname === "/dashboard";
    }

    return location.pathname === href ||
      location.pathname.startsWith(href + "/");
  };

  const navigateTo = (href) => {
    navigate(href);
    closeSidebar?.();
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-screen w-[260px] shrink-0 flex-col
          bg-[#172C25] text-white
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >

        {/* LOGO */}
        <div className="flex h-[85px] shrink-0 items-center justify-between border-b border-white/10 px-6">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
              <Users size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide">
                People<span className="text-emerald-400">Flow</span>
              </h1>

              <p className="text-[10px] tracking-widest text-gray-400">
                HR MANAGEMENT
              </p>
            </div>
          </div>

          <button
            onClick={closeSidebar}
            className="text-gray-300 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">

          {navigation.map((group) => (
            <div key={group.label}>

              <p className="mb-3 px-3 text-[10px] font-bold tracking-[2px] text-gray-500">
                {group.label}
              </p>

              <div className="space-y-1">

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const selected = isActive(item.href);

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => navigateTo(item.href)}
                      aria-current={selected ? "page" : undefined}
                      className={`
                        flex w-full items-center gap-3 rounded-xl
                        px-3 py-3 text-sm transition-all duration-200
                        ${
                          selected
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }
                      `}
                    >
                      <Icon size={18} />

                      <span className="font-medium">
                        {item.name}
                      </span>
                    </button>
                  );
                })}

              </div>
            </div>
          ))}

        </nav>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-white/10 p-4">

          <button
            type="button"
            onClick={() => navigateTo("/settings")}
            className={`
              flex w-full items-center gap-3 rounded-xl
              px-3 py-3 text-sm transition-all
              ${
                isActive("/settings")
                  ? "bg-emerald-600 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <Settings size={18} />
            Settings
          </button>

          {/* ADMIN PROFILE */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Administrator
              </p>

              <p className="truncate text-xs text-gray-400">
                System Admin
              </p>
            </div>

            <ShieldCheck
              size={17}
              className="ml-auto shrink-0 text-emerald-400"
            />

          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
