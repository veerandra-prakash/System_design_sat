import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  MapPin,
  Truck,
  Phone,
  Navigation,
  FileText,
  AlertCircle,
  XCircle,
  RotateCw
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';

export default function EmergencyStatusPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data?.data?.request);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load emergency status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const socket = getSocket();
    socket.emit('join_request', id);

    const handleUpdate = () => {
      fetchStatus();
    };

    socket.on('request_updated', handleUpdate);

    const interval = setInterval(fetchStatus, 10000);

    return () => {
      socket.off('request_updated', handleUpdate);
      socket.emit('leave_request', id);
      clearInterval(interval);
    };
  }, [id]);

  const handleCancel = async (e) => {
    e.preventDefault();
    try {
      setCancelling(true);
      await api.patch(`/requests/${id}/cancel`, {
        cancellationReason: cancellationReason || 'Cancelled from status screen'
      });
      setCancelModalOpen(false);
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        Loading emergency status details...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to retrieve status.'}</p>
        <Link to="/dashboard" className="text-red-600 underline font-semibold text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const amb = request.ambulanceId;
  const isCancellable = !['PATIENT_PICKED_UP', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(
    request.status
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Emergency Status Details</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono">Reference ID: #{request._id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'].includes(request.status) && (
            <Link
              to={`/track/${request._id}`}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live Map View</span>
            </Link>
          )}

          {isCancellable && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Status Timeline (Left) & Request Summary (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Status Timeline Column */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Trip Lifecycle Progression</h3>
            <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
          </div>

          <StatusTimeline status={request.status} statusHistory={request.statusHistory} />
        </div>

        {/* Details Spec Column */}
        <div className="md:col-span-5 space-y-6">
          {/* Assigned Unit */}
          {amb ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Unit
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{amb.ambulanceNumber}</h3>
                  <span className="text-xs text-slate-500">Registration: {amb.registrationNumber}</span>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                  {amb.type} Tier
                </span>
              </div>

              {amb.driverId && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Paramedic Driver
                  </span>
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{amb.driverId.name}</strong>
                    <span className="text-slate-600 font-mono">📞 {amb.driverId.phone}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <span className="text-slate-400 block font-medium">Last Location Timestamp:</span>
                <span className="text-slate-700 font-mono font-semibold">
                  {amb.location?.updatedAt ? new Date(amb.location.updatedAt).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-amber-900 text-xs">
              <strong>Pending Dispatch:</strong> Awaiting nearest eligible available ambulance.
            </div>
          )}

          {/* Location & Routing Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">
              Trip Addresses
            </span>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Pickup Location</span>
                <p className="text-slate-900 font-bold flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span>{request.pickup?.address}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">Destination Hospital</span>
                <p className="text-slate-900 font-bold flex items-start gap-1 mt-0.5">
                  <span className="text-sm">🏥</span>
                  <span>{request.destination?.hospitalName || 'Emergency Hospital'}</span>
                </p>
                <p className="text-slate-500 text-[11px] pl-5">{request.destination?.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cancel Ambulance Request?</h3>
            <p className="text-xs text-slate-500">
              Please state why you are cancelling this emergency dispatch.
            </p>
            <form onSubmit={handleCancel} className="space-y-4">
              <textarea
                required
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Keep Active
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
