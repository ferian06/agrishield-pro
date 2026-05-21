import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cropService } from '../services/cropService';

/**
 * AI diagnosis feedback bar — thumbs up / down.
 * Records locally (context) and attempts to POST to the backend.
 * Silently degrades if the backend is unreachable.
 */
export default function FeedbackBar({ scanId }) {
  const { submitFeedback, getFeedback } = useAppContext();
  const existing = getFeedback(scanId);
  const [busy, setBusy] = useState(false);

  const handle = async (rating) => {
    if (existing || busy) return;
    setBusy(true);

    // 1. Store locally — instant UI update
    submitFeedback(scanId, rating);

    // 2. Fire-and-forget to backend (non-blocking, gracefully fails)
    cropService.submitFeedback(scanId, rating).catch(() => {});

    setBusy(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
        AI Feedback — Help Us Improve
      </p>

      {existing ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-green-600 text-sm font-bold">✓</span>
          <p className="text-sm font-semibold text-slate-600">
            Thank you! Your feedback trains our model.
          </p>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handle('up')}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-600 font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
          >
            <ThumbsUp size={17} />
            Accurate
          </button>
          <button
            onClick={() => handle('down')}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-500 font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
          >
            <ThumbsDown size={17} />
            Inaccurate
          </button>
        </div>
      )}
    </div>
  );
}
