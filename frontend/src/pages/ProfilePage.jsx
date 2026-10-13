import React, { useState } from 'react';
import { User, Phone, Mail, Heart, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    contactName: user?.emergencyContact?.name || '',
    contactPhone: user?.emergencyContact?.phone || '',
    contactRel: user?.emergencyContact?.relationship || ''
  });

  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccessNotice('');
    setErrorNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorNotice('');
      const res = await api.patch('/auth/me', {
        name: formData.name,
        phone: formData.phone,
        emergencyContact: {
          name: formData.contactName,
          phone: formData.contactPhone,
          relationship: formData.contactRel
        }
      });
      if (res.data?.data?.user) {
        updateUser(res.data.data.user);
        setSuccessNotice('Profile & emergency contact details saved successfully.');
      }
    } catch (err) {
      setErrorNotice(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-red-600" />
          <span>Patient Profile & Emergency Contacts</span>
        </h1>
        <p className="text-xs text-slate-500">
          Ensure your contact numbers and next-of-kin emergency contacts are accurate for EMS paramedics.
        </p>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
            Personal Information
          </h3>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Full Legal Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full p-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Primary Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 uppercase block mb-1">Assigned Account Role</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg uppercase inline-block">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Next-of-Kin Emergency Contact
            </h3>
          </div>
          <p className="text-[11px] text-slate-500">
            This contact will be notified by the hospital emergency department or dispatch team if the patient is incapacitated.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g. Mary Doe"
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="e.g. +1-555-0302"
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Relationship</label>
              <input
                type="text"
                name="contactRel"
                value={formData.contactRel}
                onChange={handleChange}
                placeholder="e.g. Spouse / Parent"
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow flex items-center justify-center gap-2 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
        </button>
      </form>
    </div>
  );
}
