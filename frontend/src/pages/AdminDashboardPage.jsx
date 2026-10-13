import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Truck,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  TrendingUp,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import LeafletMap from '../components/LeafletMap';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, analRes, ambRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics'),
        api.get('/admin/ambulances')
      ]);

      setData(dashRes.data?.data);
      setAnalytics(analRes.data?.data);
      setAmbulances(ambRes.data?.data?.ambulances || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchAdminData();
    };

    socket.on('admin_request_updated', handleUpdate);
    socket.on('fleet_status_updated', handleUpdate);

    return () => {
      socket.off('admin_request_updated', handleUpdate);
      socket.off('fleet_status_updated', handleUpdate);
    };
  }, []);

  const metrics = data?.metrics || {};
  const recentRequests = data?.recentRequests || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold border border-blue-200">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
            <span>Central EMS Operations Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Admin Dispatch Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time fleet monitoring, emergency call queues, and intelligent automated assignment metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/ambulances"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow"
          >
            Fleet Inventory
          </Link>
          <Link
            to="/admin/requests"
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow"
          >
            All Emergency Requests
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Ambulances
          </span>
          <span className="text-2xl font-extrabold text-slate-900">{metrics.totalAmbulances ?? 0}</span>
          <span className="text-[10px] text-slate-500 block">Registered Fleet</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Available Online
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">{metrics.availableAmbulances ?? 0}</span>
          <span className="text-[10px] text-emerald-700 block">Ready for Dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            On Trips / Assigned
          </span>
          <span className="text-2xl font-extrabold text-amber-600">{metrics.onTripAmbulances ?? 0}</span>
          <span className="text-[10px] text-amber-700 block">En Route to Scenes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
            Active Emergencies
          </span>
          <span className="text-2xl font-extrabold text-red-600">{metrics.activeEmergencies ?? 0}</span>
          <span className="text-[10px] text-red-700 block">Undergoing Transit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
            Completed Trips
          </span>
          <span className="text-2xl font-extrabold text-purple-600">{metrics.completedRequests ?? 0}</span>
          <span className="text-[10px] text-slate-500 block">Transferred to Care</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending Requests
          </span>
          <span className="text-2xl font-extrabold text-slate-700">{metrics.pendingRequests ?? 0}</span>
          <span className="text-[10px] text-slate-400 block">Awaiting Assignment</span>
        </div>
      </div>

      {/* Live Fleet Map Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Ambulance Fleet Map</h2>
            <p className="text-xs text-slate-500">Real-time GPS positions of all registered ambulances</p>
          </div>
          <Link to="/admin/ambulances" className="text-xs font-bold text-blue-600 hover:underline">
            Manage Fleet →
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200">
          <LeafletMap
            ambulance={ambulances[0]}
            pickup={null}
            destination={null}
            height="400px"
            allowSimulation={false}
          />
        </div>
      </div>

      {/* Grid: Analytics & Recent Requests Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Requests Table (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Emergency Requests</h3>
              <p className="text-xs text-slate-500">Latest 10 incoming ambulance calls</p>
            </div>
            <Link to="/admin/requests" className="text-xs font-bold text-red-600 hover:underline">
              View All ({metrics.totalRequests || recentRequests.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Call Ref</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Assigned Unit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      #{req._id.slice(-6)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{req.patientId?.name || 'Caller'}</span>
                      <span className="text-[11px] text-slate-500">{req.patientContactNumber}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{req.emergencyType}</td>
                    <td className="py-3 px-3">
                      {req.ambulanceId ? (
                        <span className="font-bold text-blue-700">
                          {req.ambulanceId.ambulanceNumber} ({req.requestedAmbulanceType})
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/status/${req._id}`}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Breakdown Card (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Emergency Call Analytics</span>
            </h3>
            <p className="text-xs text-slate-500">Distribution by pathology & ambulance class</p>
          </div>

          {/* Breakdown by Emergency Type */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Incidents by Emergency Category
            </span>
            <div className="space-y-1.5 text-xs">
              {analytics?.byEmergencyType?.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-700 font-medium">{cat._id}</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown by Ambulance Type */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Fleet Capacity by Tier
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {analytics?.byAmbulanceType?.map((t) => (
                <div key={t._id} className="p-2 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="block text-[10px] font-bold text-blue-600">{t._id}</span>
                  <strong className="text-base text-slate-900">{t.count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Average ETA */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
            <span className="font-bold block">Average Urban Dispatch Response</span>
            <p className="text-[11px] text-emerald-800">
              Avg Distance: <strong>~{Math.round((analytics?.averages?.avgDistanceKm || 2.4) * 10) / 10} km</strong> • Avg ETA:{' '}
              <strong>~{Math.round(analytics?.averages?.avgEtaMinutes || 6)} minutes</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
