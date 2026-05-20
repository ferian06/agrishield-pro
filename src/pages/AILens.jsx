import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ScanLine, Loader2, Database } from 'lucide-react';

const mockModels = {
  tomato: {
    crop: 'Tomato Plot B',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 94.2,
    severity: 'danger',
    bg: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=400'
  },
  corn: {
    crop: 'Corn Sector 2',
    disease: 'Common Rust (Puccinia sorghi)',
    confidence: 82.7,
    severity: 'warning',
    bg: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400'
  }
};

export default function AILens() {
  const [selectedModel, setSelectedModel] = useState('tomato');
  const [isProcessing, setIsProcessing] = useState(false);
  const { addScan } = useAppContext();
  const navigate = useNavigate();

  const handleScan = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      addScan({ id: Date.now(), ...mockModels[selectedModel], date: 'Just now' });
      navigate('/diagnosis');
    }, 2200);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Camera viewfinder */}
      <div className="relative h-[300px] rounded-[28px] overflow-hidden bg-black border-[3px] border-white/20 shadow-xl flex-shrink-0">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
            isProcessing ? 'scale-110 blur-sm brightness-50' : 'scale-100 brightness-90'
          }`}
          style={{ backgroundImage: `url(${mockModels[selectedModel].bg})` }}
        />
        {/* Scan reticle corners */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-40 h-40">
            <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-green-400/90 rounded-tl-md" />
            <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-green-400/90 rounded-tr-md" />
            <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-green-400/90 rounded-bl-md" />
            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-green-400/90 rounded-br-md" />
          </div>
        </div>
        {/* Crop label */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
          📍 {mockModels[selectedModel].crop}
        </div>
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
            <div className="bg-black/65 backdrop-blur-md p-7 rounded-3xl flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-brand-mint" size={36} />
              <p className="text-[11px] font-bold tracking-widest uppercase text-green-300">Executing Tensor...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        {/* NOTE: label uses flex as a div wrapper, not on the <label> element itself */}
        <div className="flex items-center gap-1.5 mb-2">
          <Database size={12} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inject Mock Sample</span>
        </div>
        <select
          className="w-full p-4 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-forest-mid transition-colors appearance-none cursor-pointer"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isProcessing}
        >
          <option value="tomato">Tomato Plant (Early Blight)</option>
          <option value="corn">Corn Crop (Common Rust)</option>
        </select>

        <button
          onClick={handleScan}
          disabled={isProcessing}
          className="mt-4 w-full bg-forest-mid hover:bg-forest-dark text-white font-bold p-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-70 shadow-md"
        >
          <ScanLine size={20} />
          {isProcessing ? 'Analysing...' : 'Execute Edge Inference'}
        </button>
      </div>
    </div>
  );
}
