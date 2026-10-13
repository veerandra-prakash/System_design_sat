import React from 'react';
import {
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  UserCheck,
  Flag,
  XCircle,
  AlertOctagon
} from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const configs = {
    REQUESTED: {
      label: 'Pending Dispatch',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Clock,
      pulse: true
    },
    ACCEPTED: {
      label: 'Ambulance Assigned',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: CheckCircle,
      pulse: true
    },
    DISPATCHED: {
      label: 'En Route',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Truck,
      pulse: true
    },
    ARRIVING: {
      label: 'Arriving at Scene',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: MapPin,
      pulse: true
    },
    PATIENT_PICKED_UP: {
      label: 'Patient Onboard',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      icon: UserCheck,
      pulse: false
    },
    COMPLETED: {
      label: 'Trip Completed',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Flag,
      pulse: false
    },
    CANCELLED: {
      label: 'Request Cancelled',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: XCircle,
      pulse: false
    },
    REJECTED: {
      label: 'Dispatch Rejected',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertOctagon,
      pulse: false
    }
  };

  const config = configs[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Clock,
    pulse: false
  };

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm ${config.color} ${sizeClasses}`}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
