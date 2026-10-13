import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  Activity,
  User,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import LeafletMap from '../components/LeafletMap';

export default function AmbulanceDetailsPage() {
  const { id } = useParams();
  const [ambulance, setAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAmbulance = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/ambulances/${id}`);
        setAmbulance(res.data?.data?.ambulance);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ambulance details');
      } finally {
        setLoading(false);
      }
    };
    fetchAmbulance();
  }, [id]);

  if (loading) {
    return <div className="py-24 text-center text-slate-500 text-sm">Loading ambulance specifications...</div>;
  }

  if (error || !ambulance) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Ambulance Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to retrieve vehicle profile.'}</p>
        <Link to="/" className="text-red-600 underline font-semibold text-sm">
          Return to Fleet Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">{ambulance.ambulanceNumber}</h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              {ambulance.type} Tier
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                ambulance.status === 'Available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : ambulance.status === 'On Trip'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              ● {ambulance.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Registration: <span className="font-mono font-bold text-slate-700">{ambulance.registrationNumber}</span>
          </p>
        </div>
      </div>

      {/* Grid: Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map */}
        <div className="lg:col-span-7 space-y-2">
          <LeafletMap
            ambulance={ambulance}
            pickup={null}
            destination={null}
            height="420px"
            allowSimulation={false}
          />
        </div>

        {/* Specs Details Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
              Vehicle Telemetry & Assignment
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block font-medium">Current Base / En Route:</span>
                <p className="text-slate-900 font-bold flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{ambulance.location?.address}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Latitude</span>
                  <span>{ambulance.location?.latitude}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Longitude</span>
                  <span>{ambulance.location?.longitude}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Last Location Timestamp:</span>
                <span className="text-slate-700 font-mono">
                  {ambulance.location?.updatedAt
                    ? new Date(ambulance.location.updatedAt).toLocaleString()
                    : 'Awaiting signal'}
                </span>
              </div>
            </div>

            {/* Driver Profile */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Assigned Driver
              </span>
              {ambulance.driverId ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <strong className="text-slate-900 block">{ambulance.driverId.name}</strong>
                      <span className="text-[11px] text-slate-500">{ambulance.driverId.email}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${ambulance.driverId.phone}`}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    📞 {ambulance.driverId.phone}
                  </a>
                </div>
              ) : (
                <p className="text-slate-400 italic">No dedicated driver assigned. Dispatched by central team.</p>
              )}
            </div>

            {/* Equipment Inventory */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Onboard Medical Equipment
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ambulance.equipment?.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    ✓ {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
