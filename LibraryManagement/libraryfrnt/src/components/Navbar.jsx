import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to check if a route is active
  const isActive = (path) => location.pathname === path;

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Navigation Links configuration
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-fill' },
    { path: '/circulation', label: 'Circulation', icon: 'bi-journal-check' },
    { path: '/books', label: 'Books', icon: 'bi-book' },
    { path: '/members', label: 'Patrons', icon: 'bi-people' },
    { path: '/inventory', label: 'Inventory', icon: 'bi-box-seam' },
    { path: '/fines', label: 'Dues', icon: 'bi-cash-coin' },
    { path: '/reports', label: 'Reports', icon: 'bi-file-earmark-bar-graph' },
    { path: '/accounts', label: 'Accounts', icon: 'bi-shield-lock' },
    { path: '/audit', label: 'Audit Logs', icon: 'bi-journal-text' },
    { path: '/notifications', label: 'Notices', icon: 'bi-bell' },
  ];

  // Don't show navbar on Landing page, Login, or Signup
  if (['/', '/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="bg-[#fcfbf9] border-b border-stone-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-800 text-stone-50 flex items-center justify-center font-bold shadow-sm">
                <i className="bi bi-book-half text-base"></i>
              </div>
              <span className="text-xl font-bold text-stone-900 font-serif tracking-tight">LibraryShelves</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive(link.path)
                    ? 'bg-emerald-100/70 text-emerald-900 font-semibold shadow-sm'
                    : 'text-stone-600 hover:bg-[#f2efe9] hover:text-stone-900'
                }`}
              >
                <i className={`bi ${link.icon} text-sm`}></i>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Action: Logout */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 border border-rose-200 bg-rose-50/50 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-700 hover:bg-[#f2efe9] focus:outline-none"
            >
              <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#fcfbf9] border-b border-stone-200 px-4 pt-2 pb-4 space-y-1 shadow-md">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                  : 'text-stone-700 hover:bg-[#f2efe9]'
              }`}
            >
              <i className={`bi ${link.icon} text-base text-emerald-800`}></i>
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-3 border-t border-stone-200">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 text-rose-800 hover:bg-rose-50 rounded-xl text-sm font-medium"
            >
              <i className="bi bi-box-arrow-right text-base"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;