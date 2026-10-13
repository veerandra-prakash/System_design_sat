import React from 'react';
import { ShieldAlert, Heart, Phone, FileText, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-lg font-extrabold text-white">
                Ambulance<span className="text-red-500">Connect</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Next-generation Emergency Ambulance Service Management System with real-time nearest-unit dispatch, GPS tracking, and end-to-end trip lifecycle control.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Central Dispatch System Operational</span>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Patient Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/request" className="hover:text-red-400 transition flex items-center gap-1.5">
                  <span className="text-red-500 font-bold">🚨</span> Request Immediate Ambulance
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Patient Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white transition">
                  Emergency Request History
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  Emergency Contacts & Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* System & API */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Developer & Dispatch
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="http://localhost:5000/api-docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Swagger OpenAPI Documentation</span>
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5000/api/v1/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>System Health Check API</span>
                </a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition">
                  Admin Fleet Operations
                </Link>
              </li>
              <li>
                <Link to="/driver" className="hover:text-white transition">
                  Ambulance Driver Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Protocols & Disclaimer */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>National Emergency Dispatch</span>
            </h4>
            <p className="text-xs text-slate-300">
              In actual life-critical events, immediately dial:
            </p>
            <div className="text-sm font-extrabold text-white flex gap-2">
              <span className="bg-red-600/30 text-red-400 px-2 py-0.5 rounded border border-red-500/30">911 (US)</span>
              <span className="bg-red-600/30 text-red-400 px-2 py-0.5 rounded border border-red-500/30">112 (EU)</span>
              <span className="bg-red-600/30 text-red-400 px-2 py-0.5 rounded border border-red-500/30">108 (IN)</span>
            </div>
            <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-700/80">
              *Prototype Notice: Not a licensed 911 dispatch vendor. Response time estimates are calculated approximations.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} AmbulanceConnect Management System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with React, Vite, Node.js, Express, MongoDB, Socket.IO & Leaflet
          </p>
        </div>
      </div>
    </footer>
  );
}
