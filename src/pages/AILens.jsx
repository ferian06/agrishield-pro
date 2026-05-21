import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ScanLine, Loader2, Database, CameraOff, FlipHorizontal2 } from 'lucide-react';

const mockResults = {
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

export default function AILens() {
  const [selectedModel, setSelectedModel]   = useState('tomato');
  const [isProcessing, setIsProcessing]     = useState(false);
  const [facingMode, setFacingMode]         = useState('environment'); // back camera
  const [cameraReady, setCameraReady]       = useState(false);
  const [cameraError, setCameraError]       = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const { addScan } = useAppContext();
  const navigate    = useNavigate();

  // ── start / restart the camera ──────────────────────────────────────────
  const startCamera = async () => {
    setCameraReady(false);
    setCameraError(null);

    // stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera permission was denied. Please allow camera access in your browser settings.' :
        err.name === 'NotFoundError'    ? 'No camera found on this device.' :
        err.name === 'NotReadableError' ? 'Camera is already in use by another app.' :
        'Could not access camera.';
      setCameraError(msg);
    }
  };

  // start camera when component mounts or facingMode changes
  useEffect(() => {
    startCamera();
    // cleanup: stop the stream when leaving this page
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  // ── capture a still frame from the video ────────────────────────────────
  const captureFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  // ── run the mock scan ────────────────────────────────────────────────────
  const handleScan = () => {
    if (isProcessing) return;

    // capture the current camera frame before we start the animation
    const snapshot = captureFrame();

    setIsProcessing(true);

    setTimeout(() => {
      const result = mockResults[selectedModel];
      addScan({
        id:   Date.now(),
        ...result,
        bg:   snapshot || '',   // real photo used as thumbnail in Hub
        date: 'Just now',
      });
      setIsProcessing(false);
      navigate('/diagnosis');
    }, 2200);
  };

  const flipCamera = () =>
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));

  return (
    <div className="flex flex-col gap-4">

      {/* ── Camera viewfinder ─────────────────────────────────────────── */}
      <div className="relative h-[300px] rounded-[28px] overflow-hidden bg-slate-900 border-[3px] border-white/20 shadow-xl flex-shrink-0">

        {cameraError ? (
          /* ── Permission / error state ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <CameraOff size={32} className="text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
            <button
              onClick={startCamera}
              className="text-xs font-bold text-brand-mint border border-brand-mint/40 px-4 py-2 rounded-full"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* ── Live video ── */
          <video
            ref={videoRef}
            autoPlay
            playsInline        /* REQUIRED for iOS Safari — prevents fullscreen takeover */
            muted              /* REQUIRED for autoplay to work in browsers */
            onCanPlay={() => setCameraReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              isProcessing
                ? 'scale-110 blur-sm brightness-50'
                : cameraReady
                  ? 'scale-100 brightness-90'
                  : 'scale-100 brightness-0'  /* black while camera is loading */
            }`}
          />
        )}

        {/* Hidden canvas used only for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading spinner while camera initialises */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-slate-500" />
          </div>
        )}

        {/* Scan reticle corners */}
        {!cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-40 h-40">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-green-400/90 rounded-tl-md" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-green-400/90 rounded-tr-md" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-green-400/90 rounded-bl-md" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-green-400/90 rounded-br-md" />
            </div>
          </div>
        )}

        {/* Crop label */}
        {!cameraError && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
            📍 {mockResults[selectedModel].crop}
          </div>
        )}

        {/* Camera flip button */}
        {!cameraError && cameraReady && !isProcessing && (
          <button
            onClick={flipCamera}
            className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full active:scale-95 transition-transform"
            title="Switch camera"
          >
            <FlipHorizontal2 size={18} />
          </button>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
            <div className="bg-black/65 backdrop-blur-md p-7 rounded-3xl flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-brand-mint" size={36} />
              <p className="text-[11px] font-bold tracking-widest uppercase text-green-300">
                Executing Tensor...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Database size={12} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Select AI Model
          </span>
        </div>

        <select
          className="w-full p-4 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-forest-mid transition-colors appearance-none cursor-pointer"
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          disabled={isProcessing}
        >
          <option value="tomato">Tomato — Early Blight Detection</option>
          <option value="corn">Corn — Common Rust Detection</option>
        </select>

        <button
          onClick={handleScan}
          disabled={isProcessing || !!cameraError || !cameraReady}
          className="mt-4 w-full bg-forest-mid hover:bg-forest-dark disabled:opacity-50 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-md"
        >
          <ScanLine size={20} />
          {isProcessing ? 'Analysing...' : 'Execute Edge Inference'}
        </button>

        {!cameraError && !cameraReady && (
          <p className="text-center text-[11px] text-slate-400 mt-3">Waiting for camera…</p>
        )}
      </div>
    </div>
  );
}
