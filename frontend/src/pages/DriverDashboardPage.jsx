import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  Navigation,
  AlertCircle,
  LocateFixed,
  RotateCw,
  Power,
  ChevronRight,
  ShieldCheck,
  User
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LeafletMap from '../components/LeafletMap';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [ambulance, setAmbulance] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharingGps, setSharingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      // Fetch ambulances where driver is assigned
      const ambRes = await api.get('/ambulances');
      const allAmbs = ambRes.data?.data?.ambulances || [];
      const myAmb = allAmbs.find(
        (a) => a.driverId && (a.driverId._id === user?._id || a.driverId === user?._id)
      ) || allAmbs[0]; // fallback to first ambulance in demo

      setAmbulance(myAmb);

      if (myAmb) {
        // Fetch active request for this ambulance
        const reqRes = await api.get('/admin/requests');
        const activeTrip = reqRes.data?.data?.requests?.find(
          (r) =>
            r.ambulanceId &&
            (r.ambulanceId._id === myAmb._id || r.ambulanceId === myAmb._id) &&
            ['ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'].includes(r.status)
        );
        setActiveRequest(activeTrip || null);
      }
    } catch (err) {
      console.error('Failed to load driver dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchDriverData();
    };

    socket.on('request_updated', handleUpdate);
    socket.on('admin_request_updated', handleUpdate);

    return () => {
      socket.off('request_updated', handleUpdate);
      socket.off('admin_request_updated', handleUpdate);
    };
  }, [user]);

  // Handle Driver Status Transitions
  const handleUpdateStatus = async (nextStatus) => {
    if (!activeRequest) return;
    try {
      setActionLoading(true);
      await api.patch(`/requests/${activeRequest._id}/status`, {
        status: nextStatus,
        note: `Driver marked status as ${nextStatus}`
      });
      fetchDriverData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Ambulance Online/Offline Status
  const handleToggleOnline = async () => {
    if (!ambulance) return;
    try {
      const nextOnline = !ambulance.isOnline;
      await api.patch(`/ambulances/${ambulance._id}/status`, {
        status: nextOnline ? 'Available' : 'Offline',
        isOnline: nextOnline
      });
      fetchDriverData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update online state');
    }
  };

  // Share Live Driver GPS
  const handleShareGps = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Geolocation not supported by browser.');
      return;
    }

    setSharingGps(true);
    setGpsNotice('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          if (ambulance?._id) {
            await api.patch(`/ambulances/${ambulance._id}/location`, {
              latitude,
              longitude,
              address: 'Driver Live GPS Position'
            });

            // Also stream through Socket.IO
            const socket = getSocket();
            socket.emit('driver_location_update', {
              ambulanceId: ambulance._id,
              latitude,
              longitude,
              address: 'Driver Live GPS Stream'
            });

            setGpsNotice(`GPS coordinates shared: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (err) {
          setGpsNotice('Failed to push GPS coordinates to server');
        } finally {
          setSharingGps(false);
        }
      },
      (err) => {
        setSharingGps(false);
        setGpsNotice(`GPS permission denied: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Driver Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <span>Paramedic Mobile Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.name || 'Ambulance Driver'}
          </h1>
          <p className="text-xs text-slate-400">
            Assigned Unit: <span className="text-white font-bold">{ambulance?.ambulanceNumber || 'AMB-101'}</span> (
            {ambulance?.type || 'ALS'} Tier) • Reg: {ambulance?.registrationNumber || 'KA-01-AB-1001'}
          </p>
        </div>

        {/* Status Toggle & GPS Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleShareGps}
            disabled={sharingGps}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
          >
            {sharingGps ? <RotateCw className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            <span>Share My GPS</span>
          </button>

          <button
            onClick={handleToggleOnline}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95 ${
              ambulance?.isOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{ambulance?.isOnline ? 'Online & Available' : 'Offline'}</span>
          </button>
        </div>
      </div>

      {gpsNotice && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{gpsNotice}</span>
        </div>
      )}

      {/* ACTIVE EMERGENCY DISPATCH CARD */}
      {activeRequest ? (
        <div className="bg-white rounded-3xl border-2 border-red-500 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-extrabold text-red-600 uppercase tracking-widest block mb-1">
                Active Emergency Mission Assigned
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {activeRequest.emergencyType}
              </h2>
              <span className="text-xs text-slate-400 font-mono">Mission Ref: #{activeRequest._id}</span>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={activeRequest.status} size="lg" />
            </div>
          </div>

          {/* Patient Details & Transit Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Patient Information
              </span>
              <strong className="text-slate-900 text-sm block">
                {activeRequest.patientId?.name || 'Emergency Caller'}
              </strong>
              <a
                href={`tel:${activeRequest.patientContactNumber}`}
                className="text-blue-700 font-bold hover:underline flex items-center gap-1 text-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{activeRequest.patientContactNumber}</span>
              </a>
              {activeRequest.description && (
                <p className="text-slate-500 text-[11px] italic pt-1 border-t border-slate-200">
                  Notes: "{activeRequest.description}"
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Pickup Scene (Scene Arrival)
              </span>
              <p className="text-slate-900 font-bold flex items-start gap-1">
                <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{activeRequest.pickup?.address}</span>
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                GPS: {activeRequest.pickup?.latitude}, {activeRequest.pickup?.longitude}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Hospital Destination
              </span>
              <p className="text-slate-900 font-bold flex items-start gap-1">
                <span className="text-base">🏥</span>
                <span>{activeRequest.destination?.hospitalName || 'Emergency Hospital'}</span>
              </p>
              <span className="text-[11px] text-slate-500 block">
                {activeRequest.destination?.address}
              </span>
            </div>
          </div>

          {/* Interactive Leaflet Tracking for Driver */}
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <LeafletMap
              pickup={activeRequest.pickup}
              destination={activeRequest.destination}
              ambulance={ambulance}
              requestId={activeRequest._id}
              height="380px"
              allowSimulation={true}
            />
          </div>

          {/* Driver Status Transition Action Bar */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Mission Action Control
              </span>
              <span className="text-sm font-semibold text-slate-200">
                Advance trip status according to dispatch protocol
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeRequest.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleUpdateStatus('DISPATCHED')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Start En Route (DISPATCHED)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {activeRequest.status === 'DISPATCHED' && (
                <button
                  onClick={() => handleUpdateStatus('ARRIVING')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Mark Arrived at Scene (ARRIVING)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {activeRequest.status === 'ARRIVING' && (
                <button
                  onClick={() => handleUpdateStatus('PATIENT_PICKED_UP')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Patient Onboard (PICKED UP)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {activeRequest.status === 'PATIENT_PICKED_UP' && (
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Transfer Complete (FINISH MISSION)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-800">No Active Mission</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You currently have no assigned emergency calls. Keep your vehicle status set to{' '}
            <strong className="text-emerald-600">Online & Available</strong> to receive automated nearest-unit dispatches.
          </p>
        </div>
      )}
    </div>
  );
}
