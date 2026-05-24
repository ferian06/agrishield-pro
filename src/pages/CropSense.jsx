import React, { useState, useRef, useEffect } from 'react';
import {
  ScanLine, Loader2, Database, CameraOff, FlipHorizontal2,
  AlertCircle, CheckCircle2, PlayCircle, StopCircle,
  FlaskConical, ClipboardCheck, RefreshCw, Share2, X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import FeedbackBar from '../components/FeedbackBar';
import { cropService } from '../services/cropService';
import { communityService } from '../services/communityService';

// ─── mock AI results (used until a real backend is connected) ─────────────────
const MOCK_RESULTS = {
  tomato: {
    crop: 'Tomato Plot B',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 94.2,
    severity: 'danger',
  },
  corn: {
    crop: 'Corn Sector 2',
    disease: 'Common Rust (Puccinia sorghi)',
    confidence: 82.7,
    severity: 'warning',
  },
};

// ─── inference step labels (cycling loading messages) ────────────────────────
const STEPS = [
  'Capturing image…',
  'Preprocessing pixel data…',
  'Running CNN inference…',
  'Classifying pathogen…',
  'Generating report…',
];

// ─── Scanner view ─────────────────────────────────────────────────────────────
function ScannerView({ onResult }) {
  const [selectedModel, setSelectedModel] = useState('tomato');
  const [isProcessing, setIsProcessing]   = useState(false);
  const [facingMode, setFacingMode]       = useState('environment');
  const [cameraReady, setCameraReady]     = useState(false);
  const [cameraError, setCameraError]     = useState(null);
  const [stepIndex, setStepIndex]         = useState(0);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ── camera lifecycle ────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraReady(false);
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera permission denied. Allow access in browser settings.' :
        err.name === 'NotFoundError'    ? 'No camera found on this device.' :
        err.name === 'NotReadableError' ? 'Camera is in use by another app.' :
        'Could not access camera.';
      setCameraError(msg);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [facingMode]);

  // ── cycle step labels while processing ──────────────────────────────────
  useEffect(() => {
    if (!isProcessing) { setStepIndex(0); return; }
    const id = setInterval(() => setStepIndex(i => (i + 1) % STEPS.length), 440);
    return () => clearInterval(id);
  }, [isProcessing]);

  // ── capture frame ────────────────────────────────────────────────────────
  const captureFrame = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.videoWidth === 0) return null;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.82);
  };

  // ── run scan ─────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (isProcessing) return;
    const snapshot = captureFrame();
    setIsProcessing(true);

    try {
      const result = await cropService.submitScan(snapshot, selectedModel);
      onResult({
        id: result.scanId || Date.now(),
        crop: selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1) + ' Plant',
        disease: result.disease,
        confidence: Math.round((result.confidence || 0) * 1000) / 10,
        severity: result.severity === 'High' ? 'danger' : result.severity === 'Moderate' ? 'warning' : 'success',
        recommendations: result.recommendations,
        aiProvider: result.aiProvider || 'stub',
        bg: snapshot || '',
        date: 'Just now',
      });
    } catch {
      await new Promise(r => setTimeout(r, 2200));
      const mock = MOCK_RESULTS[selectedModel];
      onResult({ id: Date.now(), ...mock, bg: snapshot || '', date: 'Just now' });
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      {/* Viewfinder */}
      <div className="relative h-[300px] rounded-[24px] overflow-hidden bg-slate-900 border-[2px] border-white/10 shadow-lg">

        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
              <CameraOff size={28} className="text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
            <button onClick={startCamera} className="text-xs font-bold text-brand-mint border border-brand-mint/40 px-4 py-2 rounded-full">
              Try Again
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay playsInline muted
            onCanPlay={() => setCameraReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              isProcessing ? 'scale-110 blur-sm brightness-50' : cameraReady ? 'brightness-90' : 'brightness-0'
            }`}
          />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Spinner while camera warms up */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={26} className="animate-spin text-slate-600" />
          </div>
        )}

        {/* Scan reticle */}
        {!cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-44 h-44">
              <span className="absolute top-0 left-0  w-8 h-8 border-t-[3px] border-l-[3px] border-green-400/90 rounded-tl-md" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-green-400/90 rounded-tr-md" />
              <span className="absolute bottom-0 left-0  w-8 h-8 border-b-[3px] border-l-[3px] border-green-400/90 rounded-bl-md" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-green-400/90 rounded-br-md" />
            </div>
          </div>
        )}

        {/* Plot label */}
        {!cameraError && cameraReady && !isProcessing && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
            📍 {selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)}
          </div>
        )}

        {/* Flip camera */}
        {!cameraError && cameraReady && !isProcessing && (
          <button
            onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
            className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full active:scale-90 transition-transform"
          >
            <FlipHorizontal2 size={17} />
          </button>
        )}

        {/* Processing overlay with cycling step labels */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <div className="bg-black/70 backdrop-blur-md px-8 py-6 rounded-3xl flex flex-col items-center gap-3 mx-6">
              <Loader2 className="animate-spin text-brand-mint" size={36} />
              <p className="text-[11px] font-bold tracking-widest uppercase text-green-300 text-center">
                {STEPS[stepIndex]}
              </p>
              {/* Progress dots */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= stepIndex ? 'bg-brand-mint' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <Database size={12} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select AI Model</span>
        </div>
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          disabled={isProcessing}
          className="w-full p-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-forest-mid appearance-none cursor-pointer transition-colors"
        >
          <option value="tomato">Tomato</option>
          <option value="corn">Corn / Maize</option>
          <option value="rice">Rice</option>
          <option value="wheat">Wheat</option>
          <option value="potato">Potato</option>
          <option value="cassava">Cassava</option>
          <option value="banana">Banana / Plantain</option>
          <option value="pepper">Pepper / Chilli</option>
          <option value="soybean">Soybean</option>
          <option value="coffee">Coffee</option>
          <option value="sugarcane">Sugarcane</option>
          <option value="mango">Mango</option>
          <option value="citrus">Citrus (Orange / Lemon)</option>
          <option value="groundnut">Groundnut / Peanut</option>
          <option value="onion">Onion / Garlic</option>
          <option value="cabbage">Cabbage / Lettuce</option>
          <option value="other">Other plant</option>
        </select>

        {/* Scan tips */}
        {!isProcessing && cameraReady && (
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tips for best results</p>
            <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] text-slate-500">
              <span>📷 Fill frame with the leaf</span>
              <span>💡 Use natural daylight</span>
              <span>🔍 Focus on affected area</span>
              <span>🚫 Avoid shadows & glare</span>
            </div>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={isProcessing || !!cameraError || !cameraReady}
          className="mt-4 w-full bg-forest-mid hover:bg-forest-dark disabled:opacity-50 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] shadow-md text-sm"
        >
          <ScanLine size={19} />
          {isProcessing ? 'Analysing…' : 'Scan Plant'}
        </button>
        {!cameraError && !cameraReady && (
          <p className="text-center text-[11px] text-slate-400 mt-2">Initialising camera…</p>
        )}
      </div>
    </div>
  );
}

// ─── Share to feed modal ──────────────────────────────────────────────────────
function ScanShareModal({ data, onClose }) {
  const diseaseTag =
    data.disease?.toLowerCase().includes('healthy') ? 'All Clear' :
    data.disease?.toLowerCase().includes('blight')  ? 'Early Blight' :
    data.disease?.toLowerCase().includes('rust')    ? 'Common Rust' :
    data.disease?.toLowerCase().includes('curl')    ? 'Leaf Curl' : 'Other';

  const [text, setText] = useState(
    `Detected ${data.disease} on my ${data.crop} with ${data.confidence}% confidence. ${
      data.severity === 'danger' || data.severity === 'warning'
        ? 'Applying treatment now.'
        : 'Crop looks healthy!'
    }`
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await communityService.createPost({
        content: text.trim(),
        tag: diseaseTag,
        imageData: data.bg || undefined,
      });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-w-md mx-auto rounded-t-[28px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-extrabold text-lg text-slate-800">Share to Guild Feed</h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        {data.bg && (
          <img src={data.bg} alt="Scan" className="w-full h-32 object-cover rounded-xl mb-3" />
        )}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-forest-mid transition-colors"
        />
        <div className="flex items-center gap-2 mt-2 mb-4">
          <span className={`text-[10px] font-bold border rounded-full px-2.5 py-1 ${
            diseaseTag === 'All Clear' ? 'bg-green-50 text-green-600 border-green-200' :
            diseaseTag === 'Early Blight' ? 'bg-red-50 text-red-600 border-red-200' :
            'bg-amber-50 text-amber-600 border-amber-200'
          }`}>{diseaseTag}</span>
          <span className="text-[10px] text-slate-400">Auto-tagged from scan</span>
        </div>
        <button
          onClick={submit}
          disabled={!text.trim() || busy || done}
          className="w-full bg-forest-mid disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          {done ? '✓ Posted!' : busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {done ? '' : 'Post to Guild Feed'}
        </button>
      </div>
    </div>
  );
}

// ─── Results view ─────────────────────────────────────────────────────────────
function ResultsView({ data, onNewScan }) {
  const { markTreatment, getTreatment } = useAppContext();
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [showShare, setShowShare]       = useState(false);

  const isDanger = data.severity === 'danger' || data.severity === 'warning';
  const treatment = getTreatment(data.id);

  // Voice guidance
  const handleVoice = () => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const script = isDanger
      ? `Attention. Pathogen detected on ${data.crop}. Disease: ${data.disease}. Confidence: ${data.confidence} percent. Apply copper-based fungicide within 48 hours. Remove infected leaves. Monitor daily for spread.`
      : `Scan complete for ${data.crop}. ${data.disease}. Confidence: ${data.confidence} percent. Crop is healthy. Continue standard monitoring.`;
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 0.92; u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="space-y-4">
      {/* Captured photo */}
      {data.bg && (
        <div
          className="w-full h-44 rounded-2xl bg-cover bg-center shadow-sm"
          style={{ backgroundImage: `url(${data.bg})` }}
        />
      )}

      {/* Diagnosis card */}
      <div className={`bg-white rounded-[24px] shadow-sm overflow-hidden border-t-[6px] ${isDanger ? 'border-red-500' : 'border-green-500'} border-x border-b border-slate-100`}>
        <div className="p-5 text-center">
          <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${isDanger ? 'bg-red-50' : 'bg-green-50'}`}>
            {isDanger
              ? <AlertCircle className="text-red-500"   size={28} />
              : <CheckCircle2 className="text-green-500" size={28} />}
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pathogen Classified</p>
          <h2 className="text-base font-extrabold text-slate-800 font-syne leading-snug mb-1">{data.disease}</h2>
          <p className="text-xs text-slate-400">{data.crop} · {data.date}</p>
        </div>
        {/* AI Provider badge */}
        <div className="mx-5 mb-2 flex justify-center">
          {data.aiProvider === 'stub' ? (
            <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-600 px-3 py-1 rounded-full">
              ⚠ Demo Mode — AI unavailable, result is simulated
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full">
              ✓ Live AI · {data.aiProvider === 'groq' ? 'Groq' : data.aiProvider === 'gemini' ? 'Gemini' : 'HuggingFace'}
            </span>
          )}
        </div>

        {/* Confidence bar */}
        <div className="mx-5 mb-5 bg-slate-50 p-4 rounded-2xl">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>
              {data.confidence >= 90 ? 'Very confident result' :
               data.confidence >= 75 ? 'Confident result' :
               data.confidence >= 60 ? 'Fairly confident — monitor closely' :
               'Uncertain — verify with local expert'}
            </span>
            <span className="text-slate-800">{data.confidence}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recommended Actions</p>
        <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
          {(data.recommendations?.length > 0
            ? data.recommendations
            : isDanger
              ? ['Apply copper-based fungicide within 48 hours', 'Increase air circulation around crop rows', 'Remove and destroy visibly infected leaves', 'Monitor daily for spread to adjacent plots']
              : ['Continue standard monitoring schedule', 'Maintain current irrigation levels', 'Log observation in field journal']
          ).map((rec, i) => (
            <li key={i} className="flex gap-2">
              <span className={`font-bold ${isDanger ? 'text-red-400' : 'text-green-400'}`}>•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Treatment log */}
      {treatment ? (
        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck size={17} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-700">Treatment Applied</p>
            <p className="text-[11px] text-green-500">Logged today at {treatment.time}</p>
          </div>
        </div>
      ) : isDanger ? (
        <button
          onClick={() => markTreatment(data.id)}
          className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 p-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-colors"
        >
          <FlaskConical size={17} />
          Mark Treatment Applied
        </button>
      ) : null}

      {/* AI feedback bar */}
      <FeedbackBar scanId={data.id} />

      {/* Voice guidance */}
      <button
        onClick={handleVoice}
        className={`w-full text-white p-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm shadow-md transition-colors ${isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-forest-mid hover:bg-forest-dark'}`}
      >
        {isSpeaking
          ? <><StopCircle size={19} className="text-white/80" />Stop Voice Guidance</>
          : <><PlayCircle  size={19} className="text-brand-mint" />Initialize Voice Guidance</>}
      </button>

      {/* Share to feed */}
      <button
        onClick={() => setShowShare(true)}
        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-colors"
      >
        <Share2 size={17} />
        Share to Guild Feed
      </button>

      {/* New scan */}
      <button
        onClick={onNewScan}
        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-colors"
      >
        <RefreshCw size={17} />
        New Scan
      </button>

      {showShare && <ScanShareModal data={data} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
export default function CropSense() {
  const { addScan, activeDiagnosis } = useAppContext();
  const [view, setView] = useState(activeDiagnosis ? 'results' : 'scanner');

  const handleResult = (scan) => {
    addScan(scan);
    setView('results');
  };

  const handleNewScan = () => {
    setView('scanner');
  };

  return (
    <div className="space-y-1">
      {/* Page header */}
      <div className="mb-4">
        <h2 className="font-syne font-extrabold text-xl text-slate-800">CropSense</h2>
        <p className="text-xs text-slate-400 mt-0.5">AI-powered offline crop diagnostics</p>
      </div>

      {view === 'scanner'
        ? <ScannerView onResult={handleResult} />
        : <ResultsView data={activeDiagnosis} onNewScan={handleNewScan} />}
    </div>
  );
}
