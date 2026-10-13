import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  MapPin,
  Calendar,
  Truck,
  Filter,
  ArrowRight,
  ShieldAlert,
  PlusCircle
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function RequestHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchRequests = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ page, limit: 10 });
      if (status) query.append('status', status);

      const res = await api.get(`/requests/my?${query.toString()}`);
      setRequests(res.data?.data?.requests || []);
      setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load request history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1, statusFilter);
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-red-600" />
            <span>Emergency Request History</span>
          </h1>
          <p className="text-xs text-slate-500">
            Archive of your previous and active ambulance dispatch requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ACCEPTED">Accepted / Assigned</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="REQUESTED">Pending Request</option>
            </select>
          </div>

          <Link
            to="/request"
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Request</span>
          </Link>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">Loading request history...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📋
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter
              ? `No requests match the selected '${statusFilter}' filter.`
              : 'You have not submitted any emergency ambulance requests.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{req.emergencyType}</span>
                  <StatusBadge status={req.status} size="sm" />
                  <span className="text-[11px] font-mono text-slate-400">#{req._id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>From: {req.pickup?.address}</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-xs">🏥</span>
                    <span>To: {req.destination?.hospitalName || 'Emergency Hospital'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(req.createdAt).toLocaleString()}</span>
                  </span>
                  {req.ambulanceId && (
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Truck className="w-3 h-3 text-blue-600" />
                      <span>
                        {req.ambulanceId.ambulanceNumber} ({req.requestedAmbulanceType})
                      </span>
                    </span>
                  )}
                  {req.distanceKm && (
                    <span>Distance: ~{req.distanceKm} km</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/status/${req._id}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                >
                  Status Details
                </Link>

                {['ACCEPTED', 'DISPATCHED', 'ARRIVING', 'PATIENT_PICKED_UP'].includes(req.status) && (
                  <Link
                    to={`/track/${req._id}`}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition flex items-center gap-1"
                  >
                    <span>Track Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchRequests(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                    pagination.page === p
                      ? 'bg-slate-900 text-white shadow'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
