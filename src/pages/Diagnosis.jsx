import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertCircle, CheckCircle2, PlayCircle, StopCircle, FlaskConical, ClipboardCheck } from 'lucide-react';

export default function Diagnosis() {
  const { activeDiagnosis, scanHistory, markTreatment, getTreatment } = useAppContext();
  const data = activeDiagnosis || scanHistory[0];
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleVoiceGuidance = () => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const isDanger = data.severity === 'danger' || data.severity === 'warning';
    const script = isDanger
      ? `Attention. Pathogen detected on ${data.crop}. Disease identified: ${data.disease}. Confidence score: ${data.confidence} percent. Immediate action required. Apply copper-based fungicide within 48 hours. Increase air circulation around crop rows. Remove and destroy visibly infected leaves. Monitor daily for spread to adjacent plots.`
      : `Scan complete for ${data.crop}. Disease identified: ${data.disease}. Confidence score: ${data.confidence} percent. Crop status is healthy. Continue standard monitoring schedule. Maintain current irrigation levels. Log observation in your field journal.`;

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="text-slate-300" size={32} />
        </div>
        <p className="text-slate-400 text-sm">No diagnosis yet.</p>
        <p className="text-slate-300 text-xs mt-1">Run a scan first from the Scan tab.</p>
      </div>
    );
  }

  const isDanger = data.severity === 'danger' || data.severity === 'warning';
  const accentColor = isDanger ? 'border-red-500' : 'border-green-500';
  const iconBg    = isDanger ? 'bg-red-50'    : 'bg-green-50';
  const iconColor = isDanger ? 'text-red-500' : 'text-green-500';
  const barColor  = isDanger ? 'bg-red-500'   : 'bg-green-500';
  const Icon = isDanger ? AlertCircle : CheckCircle2;

  const treatment = getTreatment(data.id);

  return (
    <div className="space-y-4">
      {/* Main diagnosis card */}
      <div className={`bg-white p-6 rounded-[28px] shadow-sm border-t-[6px] ${accentColor} border-x border-b border-slate-100`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${iconBg}`}>
            <Icon className={iconColor} size={32} />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pathogen Classified</p>
          <h2 className="text-lg font-extrabold text-slate-800 leading-snug font-syne mb-1">{data.disease}</h2>
          <p className="text-xs text-slate-400">{data.crop} · {data.date}</p>
        </div>

        {/* Confidence bar */}
        <div className="bg-slate-50 p-4 rounded-2xl mt-5">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-3">
            <span>Confidence Score</span>
            <span className="text-slate-800">{data.confidence}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-1000 rounded-full`}
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recommended Actions</p>
        <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
          {isDanger ? (
            <>
              <li className="flex gap-2"><span className="text-red-400 font-bold">•</span>Apply copper-based fungicide within 48 hours</li>
              <li className="flex gap-2"><span className="text-red-400 font-bold">•</span>Increase air circulation around crop rows</li>
              <li className="flex gap-2"><span className="text-red-400 font-bold">•</span>Remove and destroy visibly infected leaves</li>
              <li className="flex gap-2"><span className="text-red-400 font-bold">•</span>Monitor daily for spread to adjacent plots</li>
            </>
          ) : (
            <>
              <li className="flex gap-2"><span className="text-green-400 font-bold">•</span>Continue standard monitoring schedule</li>
              <li className="flex gap-2"><span className="text-green-400 font-bold">•</span>Maintain current irrigation levels</li>
              <li className="flex gap-2"><span className="text-green-400 font-bold">•</span>Log observation in field journal</li>
            </>
          )}
        </ul>
      </div>

      {/* Treatment log */}
      {treatment ? (
        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-700">Treatment Applied</p>
            <p className="text-[11px] text-green-500 mt-0.5">Logged today at {treatment.time}</p>
          </div>
        </div>
      ) : isDanger ? (
        <button
          onClick={() => markTreatment(data.id)}
          className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-colors"
        >
          <FlaskConical size={18} />
          Mark Treatment Applied
        </button>
      ) : null}

      {/* Voice guidance */}
      <button
        onClick={handleVoiceGuidance}
        className={`w-full text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-md transition-colors ${
          isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-forest-mid hover:bg-forest-dark'
        }`}
      >
        {isSpeaking ? (
          <><StopCircle size={20} className="text-white/80" />Stop Voice Guidance</>
        ) : (
          <><PlayCircle size={20} className="text-brand-mint" />Initialize Voice Guidance</>
        )}
      </button>
    </div>
  );
}
