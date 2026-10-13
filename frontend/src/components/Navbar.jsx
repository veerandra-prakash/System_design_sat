import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  PhoneCall,
  User,
  LogOut,
  Menu,
  X,
  Truck,
  Activity,
  PlusCircle,
  History,
  LayoutDashboard,
  Users,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, demoLogin, isAdmin, isDriver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickDemo = async (role) => {
    try {
      await demoLogin(role);
      setDemoMenuOpen(false);
      setMobileMenuOpen(false);
      if (role === 'admin') navigate('/admin');
      else if (role === 'driver') navigate('/driver');
      else navigate('/dashboard');
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top emergency status banner */}
      <div className="bg-slate-900 text-white text-xs py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">Central Dispatch System: Online & Monitoring Fleet</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:911"
              className="flex items-center gap-1 font-bold text-red-400 hover:text-red-300 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
              <span>Emergency Hotline: 911 / 112 / 108</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                Ambulance<span className="text-red-600">Connect</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                EMS Emergency Dispatch
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/') ? 'text-red-600 bg-red-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                {/* Patient Navigation */}
                {!isAdmin && !isDriver && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/dashboard') ? 'text-red-600 bg-red-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Patient Dashboard
                    </Link>
                    <Link
                      to="/request"
                      className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Request Ambulance
                    </Link>
                    <Link
                      to="/history"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/history') ? 'text-red-600 bg-red-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      My Requests
                    </Link>
                  </>
                )}

                {/* Driver Navigation */}
                {isDriver && (
                  <Link
                    to="/driver"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/driver') ? 'text-red-600 bg-red-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Driver Console
                  </Link>
                )}

                {/* Admin Navigation */}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/admin') ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/ambulances"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/admin/ambulances') ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Fleet Management
                    </Link>
                    <Link
                      to="/admin/requests"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive('/admin/requests') ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Emergency Requests
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/request"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  Request Ambulance
                </Link>
              </>
            )}
          </nav>

          {/* Right Area: Fast Demo Switcher & Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                title="Switch test persona instantly"
              >
                <span>⚡ Test Personas</span>
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    1-Click Instant Login
                  </div>
                  <button
                    onClick={() => handleQuickDemo('patient')}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <strong className="block text-slate-900">Patient User</strong>
                      <span className="text-[11px] text-slate-500">patient@ambulance.com</span>
                    </div>
                    <span className="text-blue-600 font-bold">→</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemo('driver')}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <strong className="block text-slate-900">Ambulance Driver</strong>
                      <span className="text-[11px] text-slate-500">driver1@ambulance.com</span>
                    </div>
                    <span className="text-purple-600 font-bold">→</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemo('admin')}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <strong className="block text-slate-900">Chief Admin</strong>
                      <span className="text-[11px] text-slate-500">admin@ambulance.com</span>
                    </div>
                    <span className="text-red-600 font-bold">→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile or Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg text-slate-700 text-sm font-medium transition"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="block text-xs font-bold text-slate-900 leading-tight">
                      {user?.name?.split(' ')?.[0]}
                    </span>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                      {user?.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/request"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold bg-red-600 text-white text-center"
          >
            🚨 Request Ambulance Now
          </Link>

          {isAuthenticated ? (
            <>
              {!isAdmin && !isDriver && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Patient Dashboard
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Request History
                  </Link>
                </>
              )}
              {isDriver && (
                <Link
                  to="/driver"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  Driver Dashboard
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/ambulances"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Manage Ambulances
                  </Link>
                  <Link
                    to="/admin/requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Manage Requests
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                My Profile ({user?.name})
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-slate-800 font-semibold border border-slate-300 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg"
              >
                Register
              </Link>
            </div>
          )}

          {/* Quick Demo Switcher on mobile */}
          <div className="pt-3 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Switch Demo Persona
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleQuickDemo('patient')}
                className="px-2 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold"
              >
                Patient
              </button>
              <button
                onClick={() => handleQuickDemo('driver')}
                className="px-2 py-1.5 bg-purple-50 text-purple-700 rounded text-xs font-semibold"
              >
                Driver
              </button>
              <button
                onClick={() => handleQuickDemo('admin')}
                className="px-2 py-1.5 bg-red-50 text-red-700 rounded text-xs font-semibold"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
