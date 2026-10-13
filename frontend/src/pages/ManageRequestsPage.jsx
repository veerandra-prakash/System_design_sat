import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Filter,
  MapPin,
  Clock,
  Truck,
  ArrowLeft,
  ChevronRight,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) query.append('status', statusFilter);
      if (emergencyFilter) query.append('emergencyType', emergencyFilter);

      const res = await api.get(`/admin/requests?${query.toString()}`);
      setRequests(res.data?.data?.requests || []);
      setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load admin emergency requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);

    const socket = getSocket();
    const handleUpdate = () => {
      fetchRequests(pagination.page);
    };

    socket.on('admin_request_updated', handleUpdate);
    return () => {
      socket.off('admin_request_updated', handleUpdate);
    };
  }, [statusFilter, emergencyFilter]);

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      await api.patch(`/requests/${reqId}/status`, {
        status: newStatus,
        note: `Dispatcher updated status to ${newStatus}`
      });
      fetchRequests(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition rejected');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <span>Emergency Requests Dispatch Queue</span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage incoming call logs, enforce triage status updates, and oversee fleet transitions
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          Total Recorded: {pagination.total} Calls
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">Pending Request</option>
              <option value="ACCEPTED">Ambulance Assigned</option>
              <option value="DISPATCHED">Dispatched En Route</option>
              <option value="ARRIVING">Arriving at Scene</option>
              <option value="PATIENT_PICKED_UP">Patient Picked Up</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Emergency:</span>
            <select
              value={emergencyFilter}
              onChange={(e) => setEmergencyFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            >
              <option value="">All Categories</option>
              <option value="Accident & Trauma">Accident & Trauma</option>
              <option value="Cardiac Arrest">Cardiac Arrest</option>
              <option value="Respiratory Distress">Respiratory Distress</option>
              <option value="Stroke">Stroke</option>
              <option value="Maternal / Pregnancy">Maternal / Pregnancy</option>
              <option value="Severe Fever / Infection">Severe Fever / Infection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">Loading call logs...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-800 text-base">No Emergency Requests Found</h3>
          <p className="text-xs text-slate-500">No requests match the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Patient / Caller</th>
                  <th className="py-3 px-4">Emergency Type</th>
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4">Assigned Ambulance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Dispatcher Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      #{req._id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{req.patientId?.name || 'Caller'}</strong>
                      <span className="text-[11px] text-slate-500">{req.patientContactNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {req.emergencyType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {req.pickup?.address}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.ambulanceId ? (
                        <span className="font-bold text-blue-700">
                          {req.ambulanceId.ambulanceNumber} ({req.requestedAmbulanceType})
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/status/${req._id}`}
                        className="text-slate-700 font-bold hover:underline"
                      >
                        Timeline
                      </Link>
                      <Link
                        to={`/track/${req._id}`}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Map
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
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
  );
}
