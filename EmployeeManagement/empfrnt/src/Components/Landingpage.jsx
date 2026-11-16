
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";

import {
  Users,
  Menu,
  X,
  LayoutDashboard,
  ArrowRight,
  CalendarDays,
  Wallet,
  UserCheck,
  ShieldCheck,
  Clock,
  TrendingUp,
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  FileBarChart,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  Target,
  HeartHandshake,
  Zap,
  Building2,
} from "lucide-react";

const Landingpage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    ["Home", "#home"],
    ["About Us", "#about"],
    ["Features", "#features"],
    ["How It Works", "#how-it-works"],
    ["Contact", "#contact"],
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">

          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#269653] rounded-xl flex items-center justify-center">
              <Users className="text-white" size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Staff<span className="text-[#269653]">Sync</span>
              </h1>
              <p className="text-xs text-gray-500">
                Employee Management System
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(([label, link]) => (
              <a
                key={label}
                href={link}
                className="text-sm font-medium text-gray-600 hover:text-[#269653] transition"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-700 hover:text-[#269653]"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="flex items-center gap-2 bg-[#269653] hover:bg-[#207D44] text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-5 border-t border-gray-100">
            <div className="flex flex-col gap-5">
              {navLinks.map(([label, link]) => (
                <a
                  key={label}
                  href={link}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-gray-600"
                >
                  {label}
                </a>
              ))}

              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="font-semibold text-gray-700"
              >
                Login
              </Link>

              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="bg-[#269653] text-white text-center py-3 rounded-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-[#F0F8F2] via-white to-[#F1EDFC]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-green-100 px-4 py-2 rounded-full mb-7 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#269653]"></span>
              <span className="text-sm font-medium text-[#269653]">
                Smarter Workforce Management
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Manage Your
              <span className="text-[#269653]"> Workforce </span>
              <span className="text-[#9B87D5]">
                Smarter & Better.
              </span>
            </h1>

            <p className="mt-7 text-gray-600 text-lg leading-relaxed max-w-xl">
              Simplify employee management with one powerful platform.
              Manage employees, track attendance, handle leave requests,
              monitor payroll and make better HR decisions.
            </p>

            <div className="flex flex-wrap gap-4 mt-9">
              <Link
                to="/signup"
                className="flex items-center gap-3 bg-[#269653] hover:bg-[#207D44] text-white px-7 py-4 rounded-xl font-semibold transition"
              >
                Get Started
                <ArrowRight size={19} />
              </Link>

              <a
                href="#features"
                className="bg-white border border-gray-200 hover:border-[#9B87D5] text-gray-700 px-7 py-4 rounded-xl font-semibold transition"
              >
                Explore Features
              </a>
            </div>

            <div className="flex flex-wrap gap-6 mt-10">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-[#269653]" size={20} />
                <span className="text-sm text-gray-600">Easy to use</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="text-[#9B87D5]" size={20} />
                <span className="text-sm text-gray-600">Centralized HR</span>
              </div>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#9B87D5]/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#269653]/20 rounded-full blur-3xl"></div>

            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 md:p-7">

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    HR Dashboard
                  </h3>
                  <p className="text-sm text-gray-400">
                    Workforce overview
                  </p>
                </div>

                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="text-[#269653]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="bg-green-50 rounded-2xl p-5">
                  <Users className="text-[#269653] mb-3" size={24} />
                  <p className="text-sm text-gray-500">Total Employees</p>
                  <h2 className="text-3xl font-bold text-gray-800 mt-1">
                    248
                  </h2>
                </div>

                <div className="bg-purple-50 rounded-2xl p-5">
                  <CalendarDays className="text-[#9B87D5] mb-3" size={24} />
                  <p className="text-sm text-gray-500">Present Today</p>
                  <h2 className="text-3xl font-bold text-gray-800 mt-1">
                    216
                  </h2>
                </div>

                <div className="bg-purple-50 rounded-2xl p-5">
                  <Wallet className="text-[#9B87D5] mb-3" size={24} />
                  <p className="text-sm text-gray-500">Payroll</p>
                  <h2 className="text-2xl font-bold text-gray-800 mt-1">
                    Managed
                  </h2>
                </div>

                <div className="bg-green-50 rounded-2xl p-5">
                  <UserCheck className="text-[#269653] mb-3" size={24} />
                  <p className="text-sm text-gray-500">Active Staff</p>
                  <h2 className="text-3xl font-bold text-gray-800 mt-1">
                    232
                  </h2>
                </div>
              </div>

              <div className="mt-6 border border-gray-100 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Workforce Activity
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Attendance</span>
                    <span className="text-sm font-semibold text-[#269653]">87%</span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-[#269653] h-2 rounded-full w-[87%]"></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Employee Retention</span>
                    <span className="text-sm font-semibold text-[#9B87D5]">94%</span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-[#9B87D5] h-2 rounded-full w-[94%]"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div>
            <span className="text-[#269653] font-semibold text-sm uppercase tracking-wider">
              About StaffSync
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 leading-tight">
              Transforming the Way Organizations
              <span className="text-[#269653]"> Manage People.</span>
            </h2>

            <p className="text-gray-600 mt-6 leading-relaxed">
              StaffSync is an employee management platform designed to
              simplify human resource operations. It brings essential
              workforce processes together in one centralized system.
            </p>

            <p className="text-gray-600 mt-4 leading-relaxed">
              From employee records and departmental organization to
              attendance, leave management and payroll, StaffSync helps
              organizations manage their workforce efficiently.
            </p>

            <Link
              to="/signup"
              className="inline-flex items-center gap-2 mt-8 text-[#269653] font-semibold hover:gap-4 transition-all"
            >
              Discover StaffSync <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-5">

            <div className="bg-green-50 rounded-3xl p-7">
              <Target size={35} className="text-[#269653]" />
              <h3 className="font-bold text-xl mt-5">Our Mission</h3>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                Simplifying workforce management through accessible
                and efficient technology.
              </p>
            </div>

            <div className="bg-purple-50 rounded-3xl p-7 mt-10">
              <Zap size={35} className="text-[#9B87D5]" />
              <h3 className="font-bold text-xl mt-5">Our Vision</h3>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                Making workforce administration smarter and more
                organized.
              </p>
            </div>

            <div className="bg-purple-50 rounded-3xl p-7">
              <HeartHandshake size={35} className="text-[#9B87D5]" />
              <h3 className="font-bold text-xl mt-5">Our Values</h3>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                Transparency, accountability and employee empowerment.
              </p>
            </div>

            <div className="bg-green-50 rounded-3xl p-7 mt-10">
              <ShieldCheck size={35} className="text-[#269653]" />
              <h3 className="font-bold text-xl mt-5">Our Commitment</h3>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                Supporting secure and reliable HR operations.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Create, update and manage employee profiles and personal information.",
      color: "green",
    },
    {
      icon: Building2,
      title: "Department Management",
      description: "Organize employees into departments and manage departmental records.",
      color: "purple",
    },
    {
      icon: CalendarDays,
      title: "Attendance Tracking",
      description: "Monitor employee attendance, working days and attendance records.",
      color: "green",
    },
    {
      icon: ClipboardCheck,
      title: "Leave Management",
      description: "Manage leave applications, approvals and employee leave balances.",
      color: "purple",
    },
    {
      icon: Wallet,
      title: "Payroll Management",
      description: "Organize payroll information and monitor employee compensation.",
      color: "green",
    },
    {
      icon: FileBarChart,
      title: "Reports & Analytics",
      description: "Generate workforce reports and gain insights into HR operations.",
      color: "purple",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#F8F9FC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#269653] text-sm font-semibold uppercase tracking-wider">
            Our Features
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Everything You Need to Manage Your Workforce
          </h2>

          <p className="text-gray-600 mt-5">
            A centralized platform that simplifies everyday HR tasks
            and improves workforce administration.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  feature.color === "green" ? "bg-green-50" : "bg-purple-50"
                }`}>
                  <Icon
                    size={28}
                    className={feature.color === "green" ? "text-[#269653]" : "text-[#9B87D5]"}
                  />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mt-6">
                  {feature.title}
                </h3>

                <p className="text-gray-500 mt-3 leading-relaxed text-sm">
                  {feature.description}
                </p>

                <div className="mt-6">
                  <ArrowUpRight className="text-gray-400" size={20} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const WhyChooseUs = () => {
  const benefits = [
    "Centralized employee information",
    "Simplified attendance monitoring",
    "Efficient leave application management",
    "Organized payroll records",
    "Improved departmental coordination",
    "Better workforce reporting",
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="bg-gradient-to-br from-[#269653] to-[#207D44] rounded-3xl p-10 lg:p-14 text-white">

            <ShieldCheck size={55} className="mb-8" />

            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              One Platform.
              <br />
              Better Workforce Management.
            </h2>

            <p className="mt-6 text-green-50 leading-relaxed">
              Bring your HR processes together and spend less time
              managing administrative tasks and more time supporting
              your people.
            </p>

            <Link
              to="/signup"
              className="inline-flex items-center gap-3 bg-white text-[#269653] px-6 py-4 rounded-xl font-semibold mt-8 hover:bg-green-50 transition"
            >
              Start Managing Better
              <ArrowRight size={18} />
            </Link>
          </div>

          <div>
            <span className="text-[#269653] font-semibold uppercase text-sm">
              Why StaffSync?
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              Designed to Make HR Management Easier
            </h2>

            <p className="text-gray-600 mt-5 leading-relaxed">
              StaffSync brings essential employee management activities
              into one organized platform.
            </p>

            <div className="space-y-5 mt-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle size={18} className="text-[#269653]" />
                  </div>

                  <p className="text-gray-700 font-medium">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: UserCheck,
      title: "Create Your Account",
      description: "Register and access your organization's StaffSync workspace.",
    },
    {
      number: "02",
      icon: Users,
      title: "Add Employees",
      description: "Create employee records and organize your departments.",
    },
    {
      number: "03",
      icon: ClipboardCheck,
      title: "Manage HR Activities",
      description: "Track attendance, manage leave and organize payroll.",
    },
    {
      number: "04",
      icon: BarChart3,
      title: "Monitor Performance",
      description: "Review workforce information and generate useful reports.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#F8F9FC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#269653] font-semibold text-sm uppercase">
            How It Works
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Get Started in Four Simple Steps
          </h2>

          <p className="text-gray-600 mt-5">
            Start organizing your workforce with a straightforward
            employee management process.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative bg-white rounded-2xl p-8 border border-gray-100">
                <span className="text-4xl font-bold text-green-100">
                  {step.number}
                </span>

                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mt-5">
                  <Icon size={27} className="text-[#269653]" />
                </div>

                <h3 className="font-bold text-lg text-gray-800 mt-6">
                  {step.title}
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed mt-3">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Statistics = () => {
  const stats = [
    { value: "100%", label: "Centralized HR Processes", icon: Building2 },
    { value: "24/7", label: "Access to Records", icon: Clock },
    { value: "6+", label: "HR Management Features", icon: BriefcaseBusiness },
    { value: "1", label: "Unified Management Platform", icon: TrendingUp },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon size={27} className="text-[#269653]" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-[#269653] mt-5">
                  {stat.value}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

const CallToAction = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-[#269653] to-[#207D44]">
      <div className="max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Ready to Simplify Your Employee Management?
        </h2>

        <p className="text-green-50 text-lg mt-6 max-w-2xl mx-auto">
          Bring your workforce information, attendance, leave and
          payroll processes together with StaffSync.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <Link
            to="/signup"
            className="bg-white text-[#269653] px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition flex items-center gap-3"
          >
            Create Your Account
            <ArrowRight size={19} />
          </Link>

          <Link
            to="/login"
            className="border border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition"
          >
            Login to StaffSync
          </Link>
        </div>

      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="text-center mb-14">
          <span className="text-[#269653] font-semibold text-sm uppercase">
            Get In Touch
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
            Contact StaffSync
          </h2>

          <p className="text-gray-500 mt-4">
            Have questions about our employee management platform?
            We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-green-50 rounded-2xl p-8 text-center">
            <Mail size={30} className="text-[#269653] mx-auto" />
            <h3 className="font-bold text-gray-800 mt-5">Email Us</h3>
            <p className="text-gray-500 text-sm mt-2">
              support@staffsync.com
            </p>
          </div>

          <div className="bg-purple-50 rounded-2xl p-8 text-center">
            <Phone size={30} className="text-[#9B87D5] mx-auto" />
            <h3 className="font-bold text-gray-800 mt-5">Call Us</h3>
            <p className="text-gray-500 text-sm mt-2">
              Contact our support team
            </p>
          </div>

          <div className="bg-green-50 rounded-2xl p-8 text-center">
            <MapPin size={30} className="text-[#269653] mx-auto" />
            <h3 className="font-bold text-gray-800 mt-5">Our Location</h3>
            <p className="text-gray-500 text-sm mt-2">
              Serving organizations everywhere
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="grid md:grid-cols-4 gap-12 pb-12">

          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#269653] rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>

              <h2 className="text-xl font-bold">
                Staff<span className="text-[#269653]">Sync</span>
              </h2>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mt-5">
              Simplifying workforce management through one
              centralized employee management platform.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-5">Quick Links</h3>

            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <a href="#home" className="hover:text-white">Home</a>
              <a href="#about" className="hover:text-white">About Us</a>
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#contact" className="hover:text-white">Contact</a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5">Our Services</h3>

            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <span>Employee Management</span>
              <span>Attendance Tracking</span>
              <span>Leave Management</span>
              <span>Payroll Management</span>
              <span>Reports & Analytics</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-5">Account</h3>

            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <Link to="/login" className="hover:text-white">Login</Link>
              <Link to="/signup" className="hover:text-white">Register</Link>
            </div>

            <div className="flex gap-4 mt-7">
                <a
                    href="#"
                    aria-label="Facebook"
                    className="text-gray-400 hover:text-[#269653] transition"
                >
                    <FaFacebookF size={20} />
                </a>
                <a
                    href="#"
                    aria-label="Instagram"
                    className="text-gray-400 hover:text-[#9B87D5] transition"
                >
                    <FaInstagram size={20} />
                </a>
                <a
                    href="#"
                    aria-label="LinkedIn"
                    className="text-gray-400 hover:text-[#269653] transition"
                >
                    <FaLinkedinIn size={20} />
                </a>

                <a
                    href="#"
                    aria-label="Twitter"
                    className="text-gray-400 hover:text-[#9B87D5] transition"
                >
                    <FaTwitter size={20} />
                </a>
                </div>
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} StaffSync. All rights reserved.</p>
          <p>Designed to simplify workforce management.</p>
        </div>

      </div>
    </footer>
  );
};
export default Landingpage;