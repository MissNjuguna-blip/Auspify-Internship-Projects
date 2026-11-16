import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Menu,
  X,
  ArrowRight,
  Library,
  Sparkles,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  ChevronDown,
} from "lucide-react";

const Landingpage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const recentBooks = [
    ["Introduction to Algorithms", "Available"],
    ["Clean Code - Robert Martin", "Borrowed"],
    ["Database System Concepts", "Available"],
  ];

  const features = [
    {
      icon: <Users size={24} />,
      title: "Member Management",
      description: "Register and maintain accurate records for every library member seamlessly.",
      color: "text-blue-700 bg-blue-100",
    },
    {
      icon: <CreditCard size={24} />,
      title: "Membership Tracking",
      description: "Monitor active, suspended, or expired library memberships with ease.",
      color: "text-green-700 bg-green-100",
    },
    {
      icon: <Calendar size={24} />,
      title: "Borrowing Periods",
      description: "Manage book checkouts, return dates, and renewal periods with clear logs.",
      color: "text-purple-700 bg-purple-100",
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Library Analytics",
      description: "Get a clear overview of total members, active circulations, and system statistics.",
      color: "text-red-700 bg-red-100",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf7] overflow-x-hidden font-sans">

      {/* =================================================
          SECTION 1: NAVIGATION BAR
      ================================================== */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#153c32] rounded-xl flex items-center justify-center shadow-md">
              <BookOpen size={24} className="text-[#d5a85e]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                Libri
              </h1>
              <p className="text-[10px] text-gray-400 tracking-[3px] uppercase font-semibold">
                Library Management
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-gray-600 hover:text-[#153c32] text-sm font-medium transition">
              Home
            </a>
            <a href="#about" className="text-gray-600 hover:text-[#153c32] text-sm font-medium transition">
              About
            </a>
            <a href="#features" className="text-gray-600 hover:text-[#153c32] text-sm font-medium transition">
              Features
            </a>
          </div>

          {/* Authentication Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-[#153c32] border border-[#153c32]/20 rounded-xl font-semibold text-sm hover:bg-[#153c32]/5 transition"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 bg-[#153c32] text-white rounded-xl font-semibold text-sm hover:bg-[#225543] transition flex items-center gap-2 shadow-sm"
            >
              Sign Up
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-[#153c32] p-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

        </div>

        {/* Mobile Navigation Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t px-6 py-6 space-y-4 shadow-lg animate-fadeIn">
            <a href="#home" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">
              Home
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">
              About
            </a>
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-gray-700 font-medium py-1">
              Features
            </a>
            <div className="flex flex-col gap-3 pt-4 border-t">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center py-3 border border-[#153c32] text-[#153c32] rounded-xl font-semibold text-sm"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="text-center py-3 bg-[#153c32] text-white rounded-xl font-semibold text-sm shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>


      {/* =================================================
          SECTION 2: HERO SECTION WITH DASHBOARD PREVIEW
      ================================================== */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-[#153c32] via-[#102f27] to-[#0c2923] text-white py-16 sm:py-24 lg:py-28"
      >
        {/* Subtle Decorative Glows */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#d5a85e]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">

            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#e5bd7c] text-xs sm:text-sm font-medium mb-6">
                <Sparkles size={15} />
                Welcome to Libri Library System
              </div>

              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                Discover. Explore.
                <span className="block text-[#d5a85e] mt-1">
                  Learn Without Limits.
                </span>
              </h2>

              <p className="mt-6 text-base sm:text-lg text-gray-200 leading-relaxed max-w-xl mx-auto lg:mx-0">
                A smart, unified platform for managing library members, monitoring book circulation, tracking renewals, and delivering a seamless digital reading experience.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#d5a85e] text-[#153c32] font-bold shadow-lg hover:bg-[#e5bd7c] hover:-translate-y-0.5 transition"
                >
                  Get Started
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition"
                >
                  Log In
                  <BookOpen size={18} />
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-3 text-white/70 text-sm">
                <Library size={18} className="text-[#d5a85e]" />
                Your complete institutional knowledge hub.
              </div>
            </div>


            {/* Right Side: Interactive Mock Dashboard Preview */}
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl shadow-black/30 lg:rotate-1 border border-white/20 text-slate-900">
                
                {/* Mock Header */}
                <div className="bg-[#153c32] px-4 py-3 rounded-xl flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#d5a85e] flex items-center justify-center text-[#153c32] font-bold text-sm">
                      L
                    </div>
                    <div>
                      <p className="font-semibold text-xs sm:text-sm">Libri Dashboard</p>
                      <p className="text-[10px] text-emerald-200">Staff Portal Preview</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block"></span>
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full inline-block"></span>
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full inline-block"></span>
                  </div>
                </div>

                {/* Mock Body Statistics */}
                <div className="p-4 sm:p-5 bg-slate-50 rounded-xl mt-3">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    ACTIVE LIBRARY MEMBERS
                  </p>
                  <div className="flex items-end justify-between gap-2 mt-1">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                      342
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      +8.4% this month
                    </span>
                  </div>

                  {/* Quick KPI Cards Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#153c32] flex items-center justify-center font-bold">
                        <Users size={16} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">Registered</p>
                      <p className="text-base sm:text-lg font-bold text-slate-800">415</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <BookOpen size={16} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">Checked Out</p>
                      <p className="text-base sm:text-lg font-bold text-slate-800">89</p>
                    </div>
                  </div>

                  {/* Recent Activity List */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-700">Recent Book Logs</p>
                      <span className="text-[10px] sm:text-xs text-[#153c32] font-medium">View all</span>
                    </div>

                    {recentBooks.map(([bookTitle, status], idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                        <span className="font-medium text-slate-700 truncate pr-2">{bookTitle}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${status === 'Available' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =================================================
          SECTION 3: ABOUT SECTION
      ================================================== */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#c49a56] uppercase tracking-[3px] text-xs font-bold">
              About Libri
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#153c32] mt-3 leading-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              Making Knowledge Accessible & Organized for Everyone.
            </h2>
            <p className="text-gray-600 leading-relaxed mt-5 text-sm sm:text-base">
              Libri is a comprehensive library management solution tailored to simplify daily administrative workflows. Our platform provides an intuitive environment where staff manage book circulation and members explore academic resources effortlessly.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3 text-sm sm:text-base">
              We empower institutions to maintain accurate records, automate expirations, and foster smooth user engagement.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 mt-6 text-[#153c32] font-bold hover:text-[#c49a56] transition"
            >
              Join Our Library Network
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">
            <img
              src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000"
              alt="Library interior study space"
              className="w-full h-[360px] object-cover hover:scale-105 transition duration-500"
              loading="lazy"
            />
          </div>
        </div>
      </section>


      {/* =================================================
          SECTION 4: FEATURES & SERVICES SECTION
      ================================================== */}
      <section id="features" className="py-20 px-6 bg-[#f5f5ef]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#c49a56] uppercase tracking-[3px] text-xs font-bold">
              System Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#153c32] mt-3" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              Designed for Modern Libraries
            </h2>
            <p className="text-gray-600 mt-3 text-sm sm:text-base leading-relaxed">
              Everything your library needs to operate efficiently under one secure platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color} mb-5`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* =================================================
          SECTION 5: CALL TO ACTION SECTION
      ================================================== */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto bg-[#153c32] rounded-3xl p-10 sm:p-16 text-center shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#d5a85e]/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl font-bold text-white relative z-10" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            Ready to Streamline Your
            <span className="text-[#d5a85e]"> Library Experience?</span>
          </h2>

          <p className="text-emerald-100/80 mt-4 max-w-xl mx-auto text-sm sm:text-base leading-relaxed relative z-10">
            Create your account today to access system resources, track borrowing history, and join our active community.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 relative z-10">
            <Link
              to="/signup"
              className="bg-[#d5a85e] hover:bg-[#e5bd7c] text-[#153c32] px-8 py-3.5 rounded-xl font-bold transition shadow-md"
            >
              Sign Up Now
            </Link>
            <Link
              to="/login"
              className="border border-white/40 hover:bg-white hover:text-[#153c32] text-white px-8 py-3.5 rounded-xl font-semibold transition"
            >
              Log In to Portal
            </Link>
          </div>
        </div>
      </section>


      {/* =================================================
          SECTION 6: FOOTER
      ================================================== */}
      <footer className="bg-[#0c2923] py-10 px-6 text-white/70">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#d5a85e] rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-[#153c32]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  Libri
                </h2>
                <p className="text-[11px] text-emerald-200/50">
                  Library Management System
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-emerald-100/70">
              <a href="#home" className="hover:text-[#d5a85e] transition">Home</a>
              <a href="#about" className="hover:text-[#d5a85e] transition">About</a>
              <a href="#features" className="hover:text-[#d5a85e] transition">Features</a>
              <Link to="/login" className="hover:text-[#d5a85e] transition">Log In</Link>
              <Link to="/signup" className="hover:text-[#d5a85e] transition">Sign Up</Link>
            </div>

          </div>

          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <p className="text-emerald-100/40 text-xs">
              © {new Date().getFullYear()} Libri Library Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landingpage;