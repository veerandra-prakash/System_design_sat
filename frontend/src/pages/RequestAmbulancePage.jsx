import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  LocateFixed,
  Phone,
  HeartPulse,
  Truck,
  AlertCircle,
  Building,
  FileText,
  RotateCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RequestAmbulancePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientContactNumber: user?.phone || '',
    pickupAddress: 'MG Road Metro Station, Gate 2',
    pickupLat: 12.9755,
    pickupLng: 77.6066,
    hospitalName: 'Bowring & Lady Curzon Emergency Hospital',
    hospitalAddress: 'Lady Curzon Rd, Shivaji Nagar',
    hospitalLat: 12.982,
    hospitalLng: 77.602,
    emergencyType: 'Accident & Trauma',
    requestedAmbulanceType: 'ALS',
    description: ''
  });

  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update phone if user logs in
  useEffect(() => {
    if (user?.phone && !formData.patientContactNumber) {
      setFormData((prev) => ({ ...prev, patientContactNumber: user.phone }));
    }
  }, [user]);

  // Browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser. Please enter manually.');
      return;
    }

    setLocating(true);
    setGeoNotice('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          pickupLat: Math.round(latitude * 1000000) / 1000000,
          pickupLng: Math.round(longitude * 1000000) / 1000000,
          pickupAddress: `GPS Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (Current Browser Location)`
        }));
        setLocating(false);
        setGeoNotice('GPS coordinates captured via browser Geolocation API.');
      },
      (err) => {
        setLocating(false);
        setGeoNotice(
          `Location access denied or unavailable (${err.message}). Using manual location coordinates.`
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      // Prompt user to sign in
      navigate('/login', { state: { from: { pathname: '/request' } } });
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        pickup: {
          address: formData.pickupAddress,
          latitude: Number(formData.pickupLat),
          longitude: Number(formData.pickupLng)
        },
        destination: {
          hospitalName: formData.hospitalName,
          address: formData.hospitalAddress,
          latitude: Number(formData.hospitalLat),
          longitude: Number(formData.hospitalLng)
        },
        patientContactNumber: formData.patientContactNumber,
        emergencyType: formData.emergencyType,
        requestedAmbulanceType: formData.requestedAmbulanceType,
        description: formData.description
      };

      const res = await api.post('/requests', payload);
      const createdRequest = res.data?.data?.request;

      if (createdRequest?._id) {
        navigate(`/request/confirmation/${createdRequest._id}`, {
          state: {
            assignmentNotice: res.data?.data?.assignmentNotice,
            request: createdRequest
          }
        });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit ambulance request. Please check required fields or contact emergency dispatch directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-200">
          <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
          <span>Immediate Ambulance Dispatch Form</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Request Emergency Ambulance</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Fill out pickup details and emergency severity. The nearest eligible ambulance will be automatically assigned.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <strong className="block font-bold">Dispatch Error:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
        {/* Section 1: Emergency Classification */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <HeartPulse className="w-4 h-4 text-red-600" />
            <span>1. Emergency Severity & Ambulance Type</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Emergency Type *
              </label>
              <select
                name="emergencyType"
                required
                value={formData.emergencyType}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium"
              >
                <option value="Accident & Trauma">Accident & Trauma (Injuries, Crash)</option>
                <option value="Cardiac Arrest">Cardiac Arrest / Heart Attack</option>
                <option value="Respiratory Distress">Respiratory Distress / Severe Asthma</option>
                <option value="Stroke">Stroke / Neurological Paralysis</option>
                <option value="Maternal / Pregnancy">Maternal / Emergency Childbirth</option>
                <option value="Severe Fever / Infection">Severe Fever / Sepsis / Infection</option>
                <option value="Other Emergency">Other Acute Medical Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Requested Ambulance Tier *
              </label>
              <select
                name="requestedAmbulanceType"
                required
                value={formData.requestedAmbulanceType}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white font-medium"
              >
                <option value="ALS">Advanced Life Support (ALS) — Paramedic + Defibrillator</option>
                <option value="ICU">Intensive Care Unit (ICU) — Ventilator + Critical Care</option>
                <option value="BLS">Basic Life Support (BLS) — Oxygen + Basic Stretcher</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Contact Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="tel"
                name="patientContactNumber"
                required
                value={formData.patientContactNumber}
                onChange={handleChange}
                placeholder="+1-555-0199 or mobile number"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pickup Location & GPS Geolocation */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>2. Patient Pickup Address & Coordinates</span>
            </h3>

            {/* Geolocation Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              {locating ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>{locating ? 'Acquiring GPS...' : 'Detect My GPS Location'}</span>
            </button>
          </div>

          {geoNotice && (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{geoNotice}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pickup Address / Landmark *
            </label>
            <input
              type="text"
              name="pickupAddress"
              required
              value={formData.pickupAddress}
              onChange={handleChange}
              placeholder="e.g. 124 MG Road, Indiranagar, Near Metro Gate"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pickup Latitude (GPS) *
              </label>
              <input
                type="number"
                step="any"
                name="pickupLat"
                required
                value={formData.pickupLat}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pickup Longitude (GPS) *
              </label>
              <input
                type="number"
                step="any"
                name="pickupLng"
                required
                value={formData.pickupLng}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Destination Hospital */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>3. Destination Hospital (Optional / Auto-Selected)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="Hospital Name"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Address
              </label>
              <input
                type="text"
                name="hospitalAddress"
                value={formData.hospitalAddress}
                onChange={handleChange}
                placeholder="Hospital Street Address"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Condition Description */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>4. Patient Symptoms / Medical Notes (Optional)</span>
          </h3>

          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe symptoms, patient consciousness, visible bleeding, or building access notes for the paramedic team..."
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        {/* Submit & Dispatch Action */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              The nearest available ambulance matching your requested tier will be reserved atomically upon submission.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                <span>Running Nearest Ambulance Assignment...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <span>CONFIRM & DISPATCH AMBULANCE NOW</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
