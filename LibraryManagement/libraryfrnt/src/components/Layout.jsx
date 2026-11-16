
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div
      className="min-h-screen flex flex-col text-[#514B3F]"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        backgroundColor: '#F5F0E6',
      }}
    >
      {/* Main Library Header */}
      <header className="bg-[#EAE5D8] border-b border-[#D8D0BD] shadow-sm">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4">
          <div className="flex items-center gap-3">

            {/* Cute Library Logo */}
            <div className="w-12 h-12 rounded-2xl bg-[#78866B] flex items-center justify-center shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                fill="none"
                className="w-8 h-8"
              >
                <path
                  d="M5 12C11 9 18 10 24 14V39C18 35 11 34 5 37V12Z"
                  fill="#F8F3E8"
                  stroke="#F8F3E8"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M43 12C37 9 30 10 24 14V39C30 35 37 34 43 37V12Z"
                  fill="#E4D8BD"
                  stroke="#F8F3E8"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M24 14V39"
                  stroke="#78866B"
                  strokeWidth="2"
                />
                <path
                  d="M10 18C14 17 17 18 20 20M10 24C14 23 17 24 20 26"
                  stroke="#A5AD91"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M28 20C32 18 35 17 38 18M28 26C32 24 35 23 38 24"
                  stroke="#A5AD91"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Library Name */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#53634B] tracking-wide">
                LibrarySys
              </h1>
              <p className="text-xs text-[#827B68] tracking-[0.18em] uppercase">
                Library Management Suite
              </p>
            </div>

          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-[#F0EBDF] border-b border-[#DDD5C4]">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E2D4] border-t border-[#D5CCB9] py-5 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Footer Branding */}
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <div>
              <p className="font-bold text-[#53634B] text-sm">
                LibrarySys Management Suite
              </p>
              <p className="text-xs text-[#827B68]">
                A home for knowledge and discovery
              </p>
            </div>
          </div>

          {/* Footer Information */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-xs text-[#77715F]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#78866B]"></span>
              Secure Staff Portal
            </span>

            <span>
              © {new Date().getFullYear()} All Rights Reserved
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default Layout;
