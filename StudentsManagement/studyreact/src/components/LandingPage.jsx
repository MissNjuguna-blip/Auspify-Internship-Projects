import React from 'react'
import { Link } from 'react-router-dom'
const LandingPage = () => {
  const features = [
    {
      icon: '🎓',
      title: 'Student Management',
      description: 'Register students, manage student profiles, view details and keep student records organised.'
    },
    {
      icon: '📚',
      title: 'Academic Management',
      description: 'Manage academic years, terms, classrooms, subjects and student enrollments.'
    },
    {
      icon: '👨‍👩‍👧',
      title: 'Guardian Management',
      description: 'Register parents and guardians and link them to their respective students.'
    },
    {
      icon: '👨‍🏫',
      title: 'Staff Management',
      description: 'Maintain staff profiles, manage employee information and organise staff records.'
    },
    {
      icon: '💰',
      title: 'Fee Management',
      description: 'Record student fee payments, track collections and manage school finances.'
    },
    {
      icon: '📊',
      title: 'Organised Records',
      description: 'Access important student and school information from one centralised platform.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}

      <nav className="bg-white shadow-sm sticky top-0 z-50">

        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <Link to="/" className="flex items-center gap-3">

            <div className="bg-blue-600 text-white w-11 h-11 rounded-xl flex items-center justify-center text-2xl">
              🎓
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                StudentMS
              </h1>

              <p className="text-xs text-gray-500">
                Student Management System
              </p>
            </div>

          </Link>

          <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">

            <a href="#home" className="hover:text-blue-600 transition">
              Home
            </a>

            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>

            <a href="#about" className="hover:text-blue-600 transition">
              About
            </a>

          </div>

          <div className="flex items-center gap-3">

            <Link
              to="/login"
              className="px-5 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition"
            >
              Log In
            </Link>

            <Link
              to="/signup"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>

          </div>

        </div>

      </nav>

      {/* HERO SECTION */}

      <section
        id="home"
        className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 text-white"
      >

        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 grid md:grid-cols-2 gap-16 items-center">

          <div>

            <span className="inline-block bg-blue-800 text-blue-100 px-4 py-2 rounded-full text-sm mb-6">
              Welcome to StudentMS
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Simplifying
              <span className="text-blue-300"> Student </span>
              Management for a Better Future.
            </h1>

            <p className="text-blue-100 text-lg mt-6 leading-relaxed">
              A centralised student management platform designed
              to make school administration easier. Manage student
              records, academics, guardians, staff and school
              finances in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-9">

              <Link
                to="/login"
                className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-center hover:bg-blue-50 transition shadow-lg"
              >
                Log In →
              </Link>

              <Link
                to="/signup"
                className="border border-white text-white px-8 py-4 rounded-xl font-bold text-center hover:bg-white hover:text-blue-900 transition"
              >
                Sign Up
              </Link>

            </div>

            <div className="mt-10 text-sm text-blue-200">
              Manage your school. Organise your records. Simplify administration.
            </div>

          </div>

          {/* HERO VISUAL */}

          <div className="relative">

            <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full"></div>

            <div className="relative bg-white rounded-2xl shadow-2xl p-6 text-gray-800">

              <div className="flex justify-between items-center border-b pb-5">

                <div>
                  <h2 className="text-xl font-bold">
                    School Dashboard
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Management Overview
                  </p>
                </div>

                <div className="bg-blue-100 p-3 rounded-xl text-2xl">
                  📊
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">

                <div className="bg-blue-50 p-5 rounded-xl">
                  <span className="text-3xl">🎓</span>
                  <p className="text-sm text-gray-500 mt-3">
                    Students
                  </p>
                  <h3 className="font-bold text-lg">
                    Student Records
                  </h3>
                </div>

                <div className="bg-purple-50 p-5 rounded-xl">
                  <span className="text-3xl">👨‍🏫</span>
                  <p className="text-sm text-gray-500 mt-3">
                    Staff
                  </p>
                  <h3 className="font-bold text-lg">
                    Staff Records
                  </h3>
                </div>

                <div className="bg-green-50 p-5 rounded-xl">
                  <span className="text-3xl">📚</span>
                  <p className="text-sm text-gray-500 mt-3">
                    Academics
                  </p>
                  <h3 className="font-bold text-lg">
                    Academic Records
                  </h3>
                </div>

                <div className="bg-orange-50 p-5 rounded-xl">
                  <span className="text-3xl">💰</span>
                  <p className="text-sm text-gray-500 mt-3">
                    Finance
                  </p>
                  <h3 className="font-bold text-lg">
                    Fee Management
                  </h3>
                </div>

              </div>

              <div className="mt-6 bg-gray-50 rounded-xl p-5">

                <h3 className="font-bold text-gray-800 mb-3">
                  Centralised School Management
                </h3>

                <div className="space-y-3">

                  {[
                    'Student Registration',
                    'Academic Administration',
                    'Guardian Information',
                    'Fee Payment Records'
                  ].map((item, index) => (

                    <div key={index} className="flex items-center gap-3 text-sm text-gray-600">

                      <span className="text-green-500">✓</span>

                      {item}

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* FEATURES */}

      <section id="features" className="py-24 bg-gray-50">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center max-w-2xl mx-auto mb-16">

            <p className="text-blue-600 font-bold uppercase tracking-wider text-sm">
              Our Features
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              Everything You Need to Manage Your School
            </h2>

            <p className="text-gray-500 mt-5 leading-relaxed">
              StudentMS provides essential tools to simplify
              school administration and improve the management
              of educational information.
            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {features.map((feature, index) => (

              <div
                key={index}
                className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >

                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-3xl mb-6">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-800">
                  {feature.title}
                </h3>

                <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                  {feature.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ABOUT SECTION */}

      <section id="about" className="py-24 bg-white">

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

          <div>

            <p className="text-blue-600 font-bold uppercase tracking-wider text-sm">
              About StudentMS
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 leading-tight">
              Making School Administration Easier and More Efficient.
            </h2>

            <p className="text-gray-500 mt-6 leading-relaxed">
              Managing a school involves handling student
              information, academic records, staff details,
              guardians and financial transactions.
            </p>

            <p className="text-gray-500 mt-4 leading-relaxed">
              StudentMS brings these essential operations
              together into one platform, helping school
              administrators maintain organised and accessible
              records.
            </p>

            <div className="mt-8 space-y-4">

              {[
                'Centralised student records',
                'Easy academic administration',
                'Organised staff and guardian information',
                'Simplified fee payment tracking'
              ].map((item, index) => (

                <div key={index} className="flex items-center gap-3">

                  <span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full">
                    ✓
                  </span>

                  <p className="text-gray-700">
                    {item}
                  </p>

                </div>

              ))}

            </div>

          </div>

          <div className="bg-gradient-to-br from-blue-900 to-indigo-700 p-10 md:p-14 rounded-3xl text-white">

            <div className="text-6xl mb-8">
              🏫
            </div>

            <h2 className="text-3xl font-bold leading-tight">
              One Platform.
              <br />
              Multiple Solutions.
            </h2>

            <p className="text-blue-100 mt-6 leading-relaxed">
              From student registration to academic management
              and fee collection, StudentMS helps bring your
              school's essential operations together.
            </p>

            <Link
              to="/signup"
              className="inline-block mt-8 bg-white text-blue-900 px-7 py-3 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Get Started →
            </Link>

          </div>

        </div>

      </section>

      {/* CALL TO ACTION */}

      <section className="bg-blue-700 py-20">

        <div className="max-w-4xl mx-auto px-6 text-center text-white">

          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>

          <p className="text-blue-100 mt-5">
            Start managing your school's information
            with a simpler and more organised system.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-9">

            <Link
              to="/login"
              className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition"
            >
              Log In
            </Link>

            <Link
              to="/signup"
              className="border border-white px-8 py-4 rounded-xl font-bold hover:bg-blue-800 transition"
            >
              Sign Up
            </Link>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-gray-950 text-gray-400">

        <div className="max-w-7xl mx-auto px-6 py-12">

          <div className="flex flex-col md:flex-row justify-between gap-8">

            <div>

              <h2 className="text-2xl font-bold text-white">
                StudentMS
              </h2>

              <p className="mt-4 text-sm max-w-sm leading-relaxed">
                A student management platform designed
                to simplify school administration and
                organise educational records.
              </p>

            </div>

            <div>

              <h3 className="text-white font-semibold mb-4">
                Quick Links
              </h3>

              <div className="flex flex-col gap-3 text-sm">

                <a href="#home" className="hover:text-white">
                  Home
                </a>

                <a href="#features" className="hover:text-white">
                  Features
                </a>

                <a href="#about" className="hover:text-white">
                  About
                </a>

                <Link to="/login" className="hover:text-white">
                  Log In
                </Link>

                <Link to="/signup" className="hover:text-white">
                  Sign Up
                </Link>

              </div>

            </div>

          </div>

          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm">

            <p>
              © {new Date().getFullYear()} StudentMS.
              All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    </div>
  )
}

export default LandingPage
