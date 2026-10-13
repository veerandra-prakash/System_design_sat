import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function PrototypeNoticeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between border-b border-amber-600 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-center md:text-left">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950 font-bold" />
        <span>
          <strong>PROJECT PROTOTYPE NOTICE:</strong> This application is a software engineering prototype and is{' '}
          <strong>NOT</strong> a substitute for calling real emergency services. In a life-threatening medical emergency, call{' '}
          <strong className="underline decoration-amber-900">911 / 112 / 108</strong> immediately. Response times are simulated/estimated.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-amber-900 hover:text-black p-1 rounded"
        title="Dismiss notice banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
