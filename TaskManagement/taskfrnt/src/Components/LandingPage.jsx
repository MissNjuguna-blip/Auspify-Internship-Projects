import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                  />
                </svg>
              </div>

              <span className="text-xl font-bold tracking-tight">
                TaskFlow
                <span className="text-indigo-600">.</span>
              </span>
            </Link>

            {/* NAVIGATION LINKS */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Home
              </a>

              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Features
              </a>

              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                About
              </a>

              <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Contact
              </a>
            </div>

            {/* AUTH BUTTONS */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition"
              >
                Log In
              </Link>

              <Link
                to="/signup"
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      </nav>
            <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT CONTENT */}
            <div>

              <span className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                Your productivity starts here
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
                Take control of your tasks.
                <span className="text-indigo-600">
                  {" "}Achieve more.
                </span>
              </h1>

              <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-xl">
                Manage your daily activities, organize projects,
                track deadlines, and stay on top of everything
                that matters with one simple productivity platform.
              </p>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 mt-9">

                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition"
                >
                  Create Free Account

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14m-7-7l7 7-7 7"
                    />
                  </svg>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 px-7 py-4 rounded-xl font-semibold transition"
                >
                  Log In
                </Link>

              </div>

              <div className="flex items-center gap-5 mt-9 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Easy to use
                </span>

                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Stay organized
                </span>
              </div>

            </div>

            {/* RIGHT DASHBOARD PREVIEW */}
            <div className="relative">

              <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-200 rounded-full blur-3xl opacity-40"></div>

              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8">

                <div className="flex items-center justify-between mb-8">

                  <div>
                    <p className="text-sm text-slate-400">Welcome back!</p>
                    <h3 className="text-xl font-bold text-slate-900">
                      Your Dashboard
                    </h3>
                  </div>

                  <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>

                </div>

                {/* STATISTICS */}
                <div className="grid grid-cols-3 gap-3 mb-7">

                  <div className="bg-indigo-50 p-3 rounded-xl">
                    <p className="text-xs text-indigo-500">Tasks</p>
                    <h3 className="text-2xl font-bold text-indigo-800">24</h3>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl">
                    <p className="text-xs text-emerald-600">Completed</p>
                    <h3 className="text-2xl font-bold text-emerald-800">16</h3>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl">
                    <p className="text-xs text-amber-600">Pending</p>
                    <h3 className="text-2xl font-bold text-amber-800">8</h3>
                  </div>

                </div>

                {/* TASK LIST */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800">Today's Tasks</h4>
                  <span className="text-xs text-indigo-600 font-semibold">View all</span>
                </div>

                <div className="space-y-3">

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" d="M5 12l4 4L19 6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700 line-through">
                        Complete project proposal
                      </p>
                      <p className="text-xs text-slate-400">Completed</p>
                    </div>
                    <span className="text-xs text-emerald-600">Done</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Review project milestones
                      </p>
                      <p className="text-xs text-slate-400">Today, 2:00 PM</p>
                    </div>
                    <span className="text-xs text-indigo-600">Active</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Prepare weekly report
                      </p>
                      <p className="text-xs text-slate-400">Tomorrow</p>
                    </div>
                    <span className="text-xs text-amber-600">Pending</span>
                  </div>

                </div>

                {/* PROGRESS */}
                <div className="mt-7">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Weekly productivity
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      75%
                    </span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-indigo-600 rounded-full"></div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>
            <section id="features" className="py-20 lg:py-28 bg-white">

        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-14">

            <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">
              Powerful Features
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Everything you need to stay productive
            </h2>

            <p className="text-slate-500 mt-4 leading-relaxed">
              Bring your work together in one place.
              Plan better, stay focused, and achieve your goals.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* FEATURE 1 */}
            <div className="p-7 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition">

              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>

              <h3 className="text-lg font-bold mb-2">Task Management</h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                Create, organize, prioritize, and monitor your daily tasks from one convenient dashboard.
              </p>

            </div>

            {/* FEATURE 2 */}
            <div className="p-7 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition">

              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18M7 3v18" />
                </svg>
              </div>

              <h3 className="text-lg font-bold mb-2">Project Management</h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                Group related tasks into projects and track progress towards your objectives.
              </p>

            </div>

            {/* FEATURE 3 */}
            <div className="p-7 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition">

              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
                </svg>
              </div>

              <h3 className="text-lg font-bold mb-2">Notifications & Alarms</h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                Stay informed about upcoming deadlines, task updates, and important activities.
              </p>

            </div>

            {/* FEATURE 4 */}
            <div className="p-7 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition">

              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold mb-2">Deadline Tracking</h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                Keep track of task deadlines and organize your schedule more effectively.
              </p>

            </div>

            {/* FEATURE 5 */}
            <div className="p-7 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition">

              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>

              <h3 className="text-lg font-bold mb-2">Progress Monitoring</h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                Monitor completed tasks, pending activities, and overall project progress.
              </p>

            </div>

            {/* FEATURE 6 */}
            <div className="p-7 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition">

              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold mb-2">Secure Access</h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                Access your personal workspace through authenticated user accounts.
              </p>

            </div>

          </div>

        </div>
      </section>
            <section id="about" className="py-20 bg-slate-50">

        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            <div>

              <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">
                About TaskFlow
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 leading-tight">
                Make every day more organized and meaningful.
              </h2>

              <p className="text-slate-600 mt-5 leading-relaxed">
                TaskFlow is a personal task management platform
                designed to help individuals organize their
                responsibilities, manage projects, and monitor
                their productivity.
              </p>

              <p className="text-slate-600 mt-4 leading-relaxed">
                Whether you are managing personal activities,
                academic assignments, or professional projects,
                TaskFlow gives you a central place to manage
                your work.
              </p>

              <Link
                to="/signup"
                className="inline-flex items-center gap-2 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Start Organizing Today
                <span>→</span>
              </Link>

            </div>

            <div className="bg-white rounded-3xl shadow-xl p-7 sm:p-10">

              <h3 className="text-xl font-bold mb-7">
                Your productivity workspace
              </h3>

              <div className="space-y-6">

                {[
                  ["Organize your tasks", "Keep daily activities structured and accessible.", "bg-indigo-500", "w-full"],
                  ["Manage your projects", "Keep related tasks grouped together.", "bg-emerald-500", "w-4/5"],
                  ["Track your progress", "See how much you have accomplished.", "bg-blue-500", "w-3/4"],
                  ["Meet your deadlines", "Stay informed about important dates.", "bg-amber-500", "w-5/6"],
                ].map(([title, description, color, width]) => (

                  <div key={title}>

                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold text-sm text-slate-800">
                        {title}
                      </h4>
                      <span className="text-xs text-emerald-600">
                        Organized
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">
                      {description}
                    </p>

                    <div className="h-2 bg-slate-100 rounded-full">
                      <div className={`h-2 rounded-full ${color} ${width}`}></div>
                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>
      </section>
            <section className="py-20 bg-indigo-600">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to take control of your productivity?
          </h2>

          <p className="text-indigo-100 mt-5 text-lg leading-relaxed">
            Start organizing your tasks, managing your projects,
            and achieving your goals today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-9">

            <Link
              to="/signup"
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold transition shadow-lg"
            >
              Create Your Account
            </Link>

            <Link
              to="/login"
              className="border border-indigo-300 text-white hover:bg-indigo-700 px-8 py-4 rounded-xl font-bold transition"
            >
              Log In to Your Account
            </Link>

          </div>

        </div>
      </section>
            <section id="contact" className="py-16 bg-white">

        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center">

            <h2 className="text-2xl font-bold text-slate-900">
              Get Started with TaskFlow
            </h2>

            <p className="text-slate-500 text-sm mt-3">
              Your journey towards better organization starts here.
            </p>

            <Link
              to="/signup"
              className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-semibold transition"
            >
              Sign Up Now
            </Link>

          </div>

        </div>
      </section>
            <footer className="bg-slate-950 text-slate-400 py-10">

        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            <div>

              <Link to="/" className="text-xl font-bold text-white">
                TaskFlow<span className="text-indigo-500">.</span>
              </Link>

              <p className="text-xs mt-2">
                Organize your work. Manage your time. Achieve more.
              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">

              <a href="#home" className="hover:text-white transition">
                Home
              </a>

              <a href="#features" className="hover:text-white transition">
                Features
              </a>

              <a href="#about" className="hover:text-white transition">
                About
              </a>

              <Link to="/login" className="hover:text-white transition">
                Login
              </Link>

              <Link to="/signup" className="hover:text-white transition">
                Sign Up
              </Link>

            </div>

          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs">
            © {new Date().getFullYear()} TaskFlow. All rights reserved.
          </div>

        </div>

      </footer>

    </div>
  );
};

export default LandingPage;