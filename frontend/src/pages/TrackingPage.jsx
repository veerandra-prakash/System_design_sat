import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Truck,
  Phone,
  ShieldAlert,
  ArrowLeft,
  XCircle,
  AlertCircle,
  Radio,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import LeafletMap from '../components/LeafletMap';
import StatusBadge from '../components/StatusBadge';

export default function TrackingPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data?.data?.request);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve ambulance tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();

    // Socket real-time listener for request status or trip updates
    const socket = getSocket();
    socket.emit('join_request', id);

    const handleRequestUpdated = (data) => {
      if (data.requestId === id) {
        fetchRequest();
      }
    };

    socket.on('request_updated', handleRequestUpdated);

    // Periodic polling fallback (every 8 seconds) in case of socket reconnection
    const interval = setInterval(fetchRequest, 8000);

    return () => {
      socket.off('request_updated', handleRequestUpdated);
      socket.emit('leave_request', id);
      clearInterval(interval);
    };
  }, [id]);

  const handleCancelRequest = async (e) => {
    e.preventDefault();
    try {
      setCancelling(true);
      await api.patch(`/requests/${id}/cancel`, {
        cancellationReason: cancellationReason || 'Cancelled by patient from live tracking screen'
      });
      setCancelModalOpen(false);
      fetchRequest();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        Connecting to live emergency telemetry...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Tracking Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'Request could not be located.'}</p>
        <Link to="/dashboard" className="text-red-600 underline text-sm font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const amb = request.ambulanceId;
  const isCancellable = !['PATIENT_PICKED_UP', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(
    request.status
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Live Ambulance Tracking</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-xs text-slate-500">
              Request Ref: <span className="font-mono font-bold text-slate-700">#{request._id}</span> • Emergency: {request.emergencyType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/status/${request._id}`}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Status Timeline</span>
          </Link>

          {isCancellable && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Leaflet Map (Left) & Telemetry Spec (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Leaflet Map Column */}
        <div className="lg:col-span-8 space-y-3">
          <LeafletMap
            pickup={request.pickup}
            destination={request.destination}
            ambulance={amb}
            requestId={request._id}
            height="560px"
            allowSimulation={true}
          />
        </div>

        {/* Telemetry & Ambulance Details Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Dispatch Metrics Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Dispatch Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Approx. Distance</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {request.distanceKm ? `~${request.distanceKm} km` : 'In Area'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Est. Response ETA</span>
                <span className="text-lg font-extrabold text-blue-600">
                  {request.etaMinutes ? `~${request.etaMinutes} min` : '5-8 min'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight italic">
              *Notice: Haversine distance and ETA are estimations. Real arrival speed depends on traffic density and road conditions.
            </p>
          </div>

          {/* Assigned Unit Details */}
          {amb ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                    🚑
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{amb.ambulanceNumber}</h4>
                    <span className="text-[11px] text-slate-500">{amb.registrationNumber}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded">
                  {amb.type} Tier
                </span>
              </div>

              {amb.driverId && (
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs space-y-1">
                  <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider block">
                    Assigned EMS Driver / Paramedic
                  </span>
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{amb.driverId.name}</strong>
                    <a
                      href={`tel:${amb.driverId.phone}`}
                      className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{amb.driverId.phone}</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Onboard Equipment:</span>
                <div className="flex flex-wrap gap-1">
                  {amb.equipment?.map((eq, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs">
              Searching nearest eligible ambulance...
            </div>
          )}

          {/* Route Milestones */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              Transit Route Points
            </span>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm">📍</span>
                <div>
                  <strong className="block text-slate-900">Pickup Scene</strong>
                  <span className="text-slate-500 text-[11px]">{request.pickup?.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                <span className="text-sm">🏥</span>
                <div>
                  <strong className="block text-slate-900">Destination Triage</strong>
                  <span className="text-slate-500 text-[11px]">
                    {request.destination?.hospitalName || 'Emergency Hospital'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Cancel Ambulance Request?</h3>
              <p className="text-xs text-slate-500">
                This will recall the dispatched ambulance and release the unit for other emergencies.
              </p>
            </div>

            <form onSubmit={handleCancelRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Patient condition resolved, or transport via personal car..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Keep Request Active
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
