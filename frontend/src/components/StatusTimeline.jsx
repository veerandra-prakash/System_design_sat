import React from 'react';
import { Check, Clock, X, AlertTriangle } from 'lucide-react';

const STEPS = [
  { key: 'REQUESTED', title: 'Emergency Requested', desc: 'Request logged into dispatch queue' },
  { key: 'ACCEPTED', title: 'Ambulance Assigned', desc: 'Nearest eligible unit assigned' },
  { key: 'DISPATCHED', title: 'Dispatched & En Route', desc: 'Emergency lights active, en route' },
  { key: 'ARRIVING', title: 'Arriving at Location', desc: 'Reaching scene / pickup address' },
  { key: 'PATIENT_PICKED_UP', title: 'Patient Onboard', desc: 'En route to hospital triage' },
  { key: 'COMPLETED', title: 'Mission Completed', desc: 'Transferred safely to emergency room' }
];

export default function StatusTimeline({ status, statusHistory = [] }) {
  const isCancelled = status === 'CANCELLED';
  const isRejected = status === 'REJECTED';

  const getStepIndex = (st) => STEPS.findIndex((s) => s.key === st);
  const currentIndex = getStepIndex(status);

  // Find timestamp for a given step from statusHistory
  const getHistoryEntry = (stepKey) => {
    return statusHistory.find((h) => h.status === stepKey);
  };

  return (
    <div className="py-4">
      {isCancelled ? (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-start gap-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-full mt-0.5">
            <X className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base text-red-700">Request Cancelled</h4>
            <p className="text-sm text-slate-600 mt-1">
              This emergency request was cancelled. Assigned ambulance was released back to active fleet service.
            </p>
            {getHistoryEntry('CANCELLED') && (
              <p className="text-xs text-slate-500 mt-2">
                Cancelled on: {new Date(getHistoryEntry('CANCELLED').timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                {getHistoryEntry('CANCELLED').note ? ` (${getHistoryEntry('CANCELLED').note})` : ''}
              </p>
            )}
          </div>
        </div>
      ) : isRejected ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 flex items-start gap-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-full mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base text-red-700">Dispatch Rejected</h4>
            <p className="text-sm text-red-600 mt-1">
              The assigned driver was unable to accept. Dispatcher is searching for next available unit.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-200 ml-4 space-y-6">
          {STEPS.map((step, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;
            const historyItem = getHistoryEntry(step.key);

            let circleClasses = 'bg-slate-200 text-slate-400 border-slate-300';
            let lineAccent = '';

            if (isCompleted) {
              circleClasses = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
              lineAccent = 'text-emerald-700 font-semibold';
            } else if (isCurrent) {
              circleClasses = 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 shadow-md animate-pulse';
              lineAccent = 'text-blue-700 font-bold';
            }

            return (
              <div key={step.key} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-[37px] top-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs ${circleClasses}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className={`text-sm md:text-base ${isCurrent ? 'text-blue-900 font-bold' : isCompleted ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'}`}>
                      {step.title}
                    </h4>
                    {historyItem && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {new Date(historyItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  {historyItem?.note && (
                    <p className="text-xs italic text-blue-800 bg-blue-50/70 p-1.5 rounded mt-1.5 border border-blue-100 inline-block">
                      Note: {historyItem.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
