import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  PlusCircle,
  Truck,
  Clock,
  MapPin,
  ChevronRight,
  Phone,
  User,
  Activity,
  Heart,
  Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, ambRes] = await Promise.all([
        api.get('/requests/my?limit=5'),
        api.get('/ambulances/available')
      ]);
      setRequests(reqRes.data?.data?.requests || []);
      setAvailableAmbulances(ambRes.data?.data?.ambulances || []);
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time updates for patient requests
    const socket = getSocket();
    const handleUpdate = () => {
      fetchData();
    };

    socket.on('request_updated', handleUpdate);
    return () => {
      socket.off('request_updated', handleUpdate);
    };
  }, []);

  // Find active emergency request (if any)
  const activeRequest = requests.find((r) =>
    ['REQUESTED', 'ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'].includes(r.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Fast Actions Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 text-red-300 text-xs font-bold border border-red-500/30">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            <span>Emergency Services Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Hello, {user?.name || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Request immediate emergency response, monitor incoming ambulance telemetry, and manage your emergency medical contacts.
          </p>
        </div>

        {/* High-visibility Request CTA */}
        <Link
          to="/request"
          className="shrink-0 px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base shadow-lg shadow-red-600/40 flex items-center gap-2 transform active:scale-95 transition"
        >
          <PlusCircle className="w-6 h-6 animate-pulse" />
          <span>Request Ambulance Now</span>
        </Link>
      </div>

      {/* ACTIVE EMERGENCY RADAR CARD */}
      {activeRequest && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 shadow-lg animate-pulse-subtle">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl shadow-md">
                🚨
              </div>
              <div>
                <span className="text-xs font-extrabold text-red-600 uppercase tracking-widest">
                  Active Emergency Request in Progress
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeRequest.emergencyType}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={activeRequest.status} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Pickup Location</span>
              <p className="text-slate-900 font-bold flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>{activeRequest.pickup?.address}</span>
              </p>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Assigned Unit</span>
              <p className="text-slate-900 font-bold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  {activeRequest.ambulanceId?.ambulanceNumber || 'Searching nearest fleet...'} (
                  {activeRequest.requestedAmbulanceType})
                </span>
              </p>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Estimated Arrival</span>
              <p className="text-slate-900 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{activeRequest.etaMinutes ? `~${activeRequest.etaMinutes} mins` : 'Calculating...'}</span>
              </p>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Requested Time</span>
              <p className="text-slate-900 font-bold">
                {new Date(activeRequest.requestedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-red-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-600 italic">
              Dispatch coordinates updated via live WebSocket channel.
            </span>
            <div className="flex items-center gap-2">
              <Link
                to={`/status/${activeRequest._id}`}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-sm transition"
              >
                Status Timeline
              </Link>
              <Link
                to={`/track/${activeRequest._id}`}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Live Map Tracking</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Profile and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Ambulance Requests</h2>
            <Link
              to="/history"
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                🚑
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Emergency Requests Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not requested any ambulances. When an emergency happens, tap the button below.
              </p>
              <Link
                to="/request"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Request Ambulance</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{req.emergencyType}</span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{req.pickup?.address}</span>
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/status/${req._id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                    >
                      Status
                    </Link>
                    {['ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'].includes(req.status) && (
                      <Link
                        to={`/track/${req._id}`}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition"
                      >
                        Track Map
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: User Profile & Emergency Info Card */}
        <div className="space-y-6">
          {/* Patient Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Patient Profile</h3>
              <Link to="/profile" className="text-xs font-bold text-red-600 hover:underline">
                Edit
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span>{user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{user?.phone || 'No phone registered'}</span>
              </div>

              {/* Next of Kin Emergency Contact */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Emergency Contact
                </span>
                {user?.emergencyContact?.name ? (
                  <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-slate-800">
                    <strong className="block font-bold">{user.emergencyContact.name}</strong>
                    <span className="text-[11px] text-slate-600 block">
                      {user.emergencyContact.relationship || 'Next of kin'} • {user.emergencyContact.phone}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No emergency contact specified.{' '}
                    <Link to="/profile" className="text-red-600 underline">
                      Add contact
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Available Fleet Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
              <span>Nearby Available Units</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-extrabold">
                {availableAmbulances.length} Online
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              {availableAmbulances.slice(0, 4).map((amb) => (
                <div key={amb._id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">{amb.ambulanceNumber}</strong>
                    <span className="text-[11px] text-slate-500">{amb.location?.address}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-bold rounded">
                    {amb.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
