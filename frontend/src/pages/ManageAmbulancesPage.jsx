import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  PlusCircle,
  Filter,
  MapPin,
  CheckCircle,
  XCircle,
  Power,
  RotateCw,
  Search,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';

export default function ManageAmbulancesPage() {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Ambulance Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    ambulanceNumber: '',
    registrationNumber: '',
    type: 'ALS',
    latitude: 12.975,
    longitude: 77.595,
    address: 'Central Station Depot',
    equipment: 'Oxygen Cylinder, Defibrillator, Stretcher, First Aid Kit'
  });

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterType) query.append('type', filterType);
      if (filterStatus) query.append('status', filterStatus);
      if (searchTerm) query.append('search', searchTerm);

      const res = await api.get(`/ambulances?${query.toString()}`);
      setAmbulances(res.data?.data?.ambulances || []);
    } catch (err) {
      console.error('Failed to load ambulances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, [filterType, filterStatus, searchTerm]);

  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      await api.post('/ambulances', {
        ambulanceNumber: formData.ambulanceNumber,
        registrationNumber: formData.registrationNumber,
        type: formData.type,
        location: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          address: formData.address
        },
        equipment: formData.equipment.split(',').map((s) => s.trim())
      });
      setIsModalOpen(false);
      setFormData({
        ambulanceNumber: '',
        registrationNumber: '',
        type: 'ALS',
        latitude: 12.975,
        longitude: 77.595,
        address: 'Central Station Depot',
        equipment: 'Oxygen Cylinder, Defibrillator, Stretcher, First Aid Kit'
      });
      fetchAmbulances();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register ambulance');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (ambId, newStatus) => {
    try {
      await api.patch(`/ambulances/${ambId}/status`, {
        status: newStatus,
        isOnline: newStatus !== 'Offline'
      });
      fetchAmbulances();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
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
              <Truck className="w-6 h-6 text-blue-600" />
              <span>Ambulance Fleet Management</span>
            </h1>
            <p className="text-xs text-slate-500">
              Register, configure, and monitor all active vehicles in the emergency response network
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Ambulance</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicle or reg #"
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            >
              <option value="">All Tiers</option>
              <option value="BLS">BLS</option>
              <option value="ALS">ALS</option>
              <option value="ICU">ICU</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="On Trip">On Trip</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Table */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">Loading fleet inventory...</div>
      ) : ambulances.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-800 text-base">No Ambulances Found</h3>
          <p className="text-xs text-slate-500">Try clearing filters or register a new ambulance.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vehicle #</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Driver Assigned</th>
                  <th className="py-3 px-4">Current Station</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ambulances.map((amb) => (
                  <tr key={amb._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      {amb.ambulanceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {amb.registrationNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded">
                        {amb.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {amb.driverId ? amb.driverId.name : <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {amb.location?.address}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          amb.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : amb.status === 'On Trip'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        ● {amb.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <select
                        value={amb.status}
                        onChange={(e) => handleUpdateStatus(amb._id, e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 font-medium outline-none"
                      >
                        <option value="Available">Set Available</option>
                        <option value="Assigned">Set Assigned</option>
                        <option value="On Trip">Set On Trip</option>
                        <option value="Offline">Set Offline</option>
                      </select>

                      <Link
                        to={`/ambulances/${amb._id}`}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Specs →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Ambulance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Register New Fleet Ambulance</h3>
            <form onSubmit={handleCreateAmbulance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Ambulance Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ambulanceNumber}
                    onChange={(e) => setFormData({ ...formData, ambulanceNumber: e.target.value })}
                    placeholder="e.g. AMB-106"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, registrationNumber: e.target.value })
                    }
                    placeholder="e.g. KA-02-XY-9876"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Ambulance Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-medium"
                >
                  <option value="ALS">Advanced Life Support (ALS)</option>
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="BLS">Basic Life Support (BLS)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Base Depot Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Central EMS Depot Bay 4"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Base Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Base Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Equipment List (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow"
                >
                  {modalLoading ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
