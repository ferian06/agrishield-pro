import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sprout, X } from 'lucide-react';

const statusConfig = {
  healthy: { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500',  bar: 'bg-green-500',  text: 'text-green-700',  badge: 'Healthy'  },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500',  bar: 'bg-amber-500',  text: 'text-amber-700',  badge: 'Warning'  },
  danger:  { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',    bar: 'bg-red-500',    text: 'text-red-600',    badge: 'Critical' },
};

function PlotDetail({ plot, onClose }) {
  const c = statusConfig[plot.status];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[400px] rounded-t-[32px] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${c.text}`}>{c.badge}</p>
            <h3 className="font-syne font-extrabold text-lg text-slate-800 mt-0.5">{plot.name}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-slate-800 font-syne">{plot.health}%</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Health</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-slate-800 font-syne">{plot.crop}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Crop Type</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-sm font-extrabold text-slate-800 font-syne leading-tight">{plot.sector}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Zone</p>
            </div>
          </div>
          <div className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Health Index</span>
              <span className={c.text}>{plot.health}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${plot.health}%` }} />
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">Last scan: {plot.lastScan}</p>
        </div>
      </div>
    </div>
  );
}

export default function FieldMap() {
  const { fieldPlots } = useAppContext();
  const [selected, setSelected] = useState(null);

  const dangerCount  = fieldPlots.filter(p => p.status === 'danger').length;
  const warningCount = fieldPlots.filter(p => p.status === 'warning').length;
  const healthyCount = fieldPlots.filter(p => p.status === 'healthy').length;

  return (
    <>
      <div className="space-y-4">
        {/* Hero card */}
        <div className="bg-forest-mid text-white p-5 rounded-[28px] relative overflow-hidden">
          <div className="absolute w-36 h-36 rounded-full bg-brand-mint/15 -top-10 -right-10 pointer-events-none" />
          <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-1">Farm Overview</p>
          <h2 className="font-syne text-2xl font-extrabold mb-4">{fieldPlots.length} Active Plots</h2>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-xl py-2.5 text-center">
              <p className="text-lg font-extrabold font-syne">{healthyCount}</p>
              <p className="text-[9px] text-green-300 uppercase font-bold">Healthy</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl py-2.5 text-center">
              <p className="text-lg font-extrabold font-syne">{warningCount}</p>
              <p className="text-[9px] text-amber-300 uppercase font-bold">Warning</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl py-2.5 text-center">
              <p className="text-lg font-extrabold font-syne">{dangerCount}</p>
              <p className="text-[9px] text-red-300 uppercase font-bold">Critical</p>
            </div>
          </div>
        </div>

        {/* Plot grid */}
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tap a plot for details</p>
          <div className="grid grid-cols-2 gap-3">
            {fieldPlots.map((plot) => {
              const c = statusConfig[plot.status];
              return (
                <button
                  key={plot.id}
                  onClick={() => setSelected(plot)}
                  className={`${c.bg} border ${c.border} p-4 rounded-[20px] text-left w-full transition-transform active:scale-[0.97]`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.dot} flex-shrink-0`} />
                    <span className={`text-[9px] font-bold uppercase ${c.text}`}>{c.badge}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sprout size={12} className="text-slate-400 flex-shrink-0" />
                    <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{plot.name}</h4>
                  </div>
                  <p className="text-[10px] text-slate-400">{plot.crop} · {plot.sector}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                      <span>Health</span>
                      <span className={`font-bold ${c.text}`}>{plot.health}%</span>
                    </div>
                    <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
                      <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${plot.health}%` }} />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">Last: {plot.lastScan}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selected && <PlotDetail plot={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
