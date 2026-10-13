import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  ShieldAlert,
  Navigation,
  FileText
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function RequestConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const [request, setRequest] = useState(location.state?.request || null);
  const [assignmentNotice, setAssignmentNotice] = useState(
    location.state?.assignmentNotice || ''
  );
  const [loading, setLoading] = useState(!request);

  useEffect(() => {
    if (!request && id) {
      const fetchRequest = async () => {
        try {
          const res = await api.get(`/requests/${id}`);
          setRequest(res.data?.data?.request);
        } catch (err) {
          console.error('Failed to load request confirmation:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchRequest();
    }
  }, [id, request]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        Retrieving emergency confirmation...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <Link to="/dashboard" className="text-red-600 underline font-semibold text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const amb = request.ambulanceId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle className="w-9 h-9 stroke-[2.2]" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Emergency Signal Logged
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Ambulance Request Confirmed
        </h1>
        <p className="text-xs text-slate-500 font-mono">Request Reference: #{request._id}</p>
      </div>

      {assignmentNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-center gap-3">
          <div className="text-xl">🚑</div>
          <div>
            <strong className="block font-bold">Dispatch Algorithm Status:</strong>
            <span>{assignmentNotice}</span>
          </div>
        </div>
      )}

      {/* Confirmation Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Emergency Status</span>
            <div className="mt-1">
              <StatusBadge status={request.status} size="lg" />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Requested At</span>
            <span className="text-xs font-bold text-slate-800">
              {new Date(request.requestedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Assigned Ambulance Spec Box */}
        {amb ? (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                Assigned Emergency Vehicle
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                {amb.type} Tier
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{amb.ambulanceNumber}</h3>
                <span className="text-xs text-slate-500">Reg: {amb.registrationNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Est. Proximity</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {request.distanceKm ? `~${request.distanceKm} km` : 'Near you'}
                </span>
              </div>
            </div>

            {amb.driverId && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Driver: <strong>{amb.driverId.name}</strong>
                </span>
                <span className="text-slate-600 font-mono">
                  📞 {amb.driverId.phone}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-xs">
            <strong>Dispatch Queue:</strong> No eligible ambulance was immediately within range. Your emergency request is pending automatic nearest assignment as soon as a unit clears trip.
          </div>
        )}

        {/* Pickup & Hospital Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">
              Pickup Location
            </span>
            <p className="text-slate-800 font-bold flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span>{request.pickup?.address}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">
              Destination Hospital
            </span>
            <p className="text-slate-800 font-bold flex items-start gap-1">
              <span className="text-sm">🏥</span>
              <span>{request.destination?.hospitalName || 'City Emergency Care'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to={`/track/${request._id}`}
            className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            <span>Open Live Tracking Map</span>
          </Link>

          <Link
            to={`/status/${request._id}`}
            className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 flex items-center justify-center gap-2 transition"
          >
            <FileText className="w-4 h-4" />
            <span>View Status Timeline</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
