import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Clock,
  HeartPulse,
  Truck,
  CheckCircle2,
  ArrowRight,
  Activity,
  AlertCircle,
  Stethoscope,
  Radio
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function LandingPage() {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await api.get('/ambulances');
        setAmbulances(res.data?.data?.ambulances || []);
      } catch (err) {
        console.error('Error loading ambulances preview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFleet();
  }, []);

  const availableCount = ambulances.filter((a) => a.status === 'Available' && a.isOnline).length;
  const onTripCount = ambulances.filter((a) => a.status === 'On Trip' || a.status === 'Assigned').length;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white py-16 lg:py-24 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-semibold backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>24/7 Intelligent Emergency Dispatch Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Rapid Emergency Ambulance <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
                Nearest-Unit Dispatch
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              When every second counts, AmbulanceConnect pairs emergency patients with the nearest available BLS, ALS, or ICU ambulance using precision Haversine telemetry and live GPS tracking.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/request"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 transform active:scale-95 transition-all duration-150"
              >
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span>Request Ambulance Now</span>
              </Link>

              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-base flex items-center justify-center gap-2 transition"
              >
                <span>Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800 max-w-lg mx-auto lg:mx-0">
              <div className="text-left">
                <span className="block text-2xl sm:text-3xl font-extrabold text-white">
                  {loading ? '...' : availableCount}
                </span>
                <span className="text-xs text-emerald-400 font-medium">Available Online</span>
              </div>
              <div className="text-left">
                <span className="block text-2xl sm:text-3xl font-extrabold text-white">
                  {loading ? '...' : onTripCount}
                </span>
                <span className="text-xs text-amber-400 font-medium">Active On Trips</span>
              </div>
              <div className="text-left">
                <span className="block text-2xl sm:text-3xl font-extrabold text-white">
                  ~4-8 <span className="text-xs font-normal text-slate-400">min</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Est. Urban ETA</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Dispatch Hub
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-mono">Telemetry: Active</span>
              </div>

              {/* Status Simulation Preview Box */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Automated Triage Flow</span>
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-semibold">
                    HIGH PRIORITY
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
                    🚑
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Haversine Nearest Search</h4>
                    <p className="text-xs text-slate-400">
                      Calculates coordinates & atomizes fleet reservations
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Dispatch Protocol:</span>
                    <span className="font-mono text-emerald-400">Atomic Reservation</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tracking Engine:</span>
                    <span className="font-mono text-blue-400">Leaflet OpenStreetMap</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync Channel:</span>
                    <span className="font-mono text-purple-400">Socket.IO WebSockets</span>
                  </div>
                </div>
              </div>

              {/* Emergency Callout */}
              <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-red-400 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-white">Direct Medical Dispatch</strong>
                  <span className="text-red-200">US: 911 | EU: 112 | India: 108</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
            Step-By-Step Emergency Response
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            How AmbulanceConnect Works
          </h2>
          <p className="text-slate-600 text-sm md:text-base">
            From distress signal to hospital emergency triage in four streamlined, transparent stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg border border-red-100">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-900">Instant Request</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Patient selects emergency category and enters location via GPS geolocation or manual address entry.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-900">Nearest Assignment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Algorithm filters available units by type (BLS, ALS, ICU), computes distance with Haversine formula, and locks reservation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-100">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-900">Live GPS Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track the dispatched ambulance on Leaflet OpenStreetMap with real-time ETA and status updates via Socket.IO.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
              4
            </div>
            <h3 className="font-bold text-lg text-slate-900">Hospital Triage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Patient is stabilized, boarded, and transferred safely to emergency hospital. Unit is promptly recycled back to fleet.
            </p>
          </div>
        </div>
      </section>

      {/* Ambulance Fleet Classifications */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Emergency Fleet Tiers
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Available Ambulance Categories
            </h2>
            <p className="text-slate-600 text-sm">
              Equipped for varying levels of patient acuity, trauma severity, and intensive life support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* BLS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-extrabold rounded-full">
                  BLS Unit
                </span>
                <span className="text-xs text-slate-500 font-semibold">Tier 1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Basic Life Support</h3>
              <p className="text-xs text-slate-600">
                Suitable for non-critical transfers, minor fractures, stable post-op transit, and basic wound first aid.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <strong className="block text-slate-900 text-xs">Standard Equipment:</strong>
                <p className="text-slate-600">Oxygen Cylinder, First Aid Kit, Stretcher, Splints, Blood Pressure Monitor</p>
              </div>
            </div>

            {/* ALS */}
            <div className="bg-white rounded-2xl p-6 border-2 border-red-500 shadow-md relative space-y-4">
              <div className="absolute -top-3 right-6 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                Most Requested
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-extrabold rounded-full">
                  ALS Unit
                </span>
                <span className="text-xs text-slate-500 font-semibold">Tier 2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Advanced Life Support</h3>
              <p className="text-xs text-slate-600">
                Equipped for acute cardiovascular emergencies, severe respiratory distress, major trauma, and strokes.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <strong className="block text-slate-900 text-xs">Advanced Equipment:</strong>
                <p className="text-slate-600">Defibrillator, ECG Monitor, Advanced Airway Kit, IV Fluids, Infusion Supplies</p>
              </div>
            </div>

            {/* ICU */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-purple-300 transition space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-extrabold rounded-full">
                  ICU / CCU Unit
                </span>
                <span className="text-xs text-slate-500 font-semibold">Tier 3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Intensive Care Ambulance</h3>
              <p className="text-xs text-slate-600">
                Mobile intensive care unit for ventilated patients, severe sepsis, multi-organ trauma, and high-risk inter-hospital transit.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <strong className="block text-slate-900 text-xs">Critical Care Equipment:</strong>
                <p className="text-slate-600">Transport Ventilator, Multi-channel Syringe Pumps, Blood Gas Monitor, Defibrillator</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Fleet Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Live Ambulance Fleet Status</h2>
            <p className="text-xs text-slate-500">Real-time telemetry feed across city zones</p>
          </div>
          <Link
            to="/request"
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Request Immediate Dispatch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading active fleet...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.slice(0, 6).map((amb) => (
              <div
                key={amb._id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base">{amb.ambulanceNumber}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded">
                      {amb.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{amb.location?.address || 'City Center Base'}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {amb.equipment?.slice(0, 3).map((eq, i) => (
                      <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
                  <span className={`text-xs font-semibold ${amb.status === 'Available' ? 'text-emerald-600' : amb.status === 'On Trip' ? 'text-amber-600' : 'text-slate-500'}`}>
                    ● {amb.status}
                  </span>
                  <Link
                    to={`/ambulances/${amb._id}`}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View Specs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
