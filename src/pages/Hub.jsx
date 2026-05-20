import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, WifiOff, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export default function Hub() {
  const { scanHistory, fieldPlots } = useAppContext();

  const dangerCount  = fieldPlots.filter(p => p.status === 'danger').length;
  const warningCount = fieldPlots.filter(p => p.status === 'warning').length;
  const healthyCount = fieldPlots.filter(p => p.status === 'healthy').length;
  const avgHealth    = Math.round(fieldPlots.reduce((sum, p) => sum + p.health, 0) / fieldPlots.length);

  return (
    <div className="space-y-4">

      {/* Alert */}
      {dangerCount > 0 && (
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm">Fungal Outbreak Hazard</h3>
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            High ambient humidity in Sector 4 favors propagation. Inspect affected zones immediately.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <ShieldCheck className="text-green-600" size={20} />
          </div>
          <div className="flex items-end gap-1.5">
            <h2 className="text-2xl font-extrabold text-slate-800 font-syne">{avgHealth}%</h2>
            <span className="flex items-center gap-0.5 text-green-500 text-[10px] font-bold mb-1">
              <TrendingUp size={12} /> +2%
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Farm Health</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <WifiOff className="text-slate-400" size={20} />
          </div>
          <div className="flex items-end gap-1.5">
            <h2 className="text-2xl font-extrabold text-slate-800 font-syne">{scanHistory.length}</h2>
            <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold mb-1">
              <TrendingDown size={12} /> active
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Offline Scans</p>
        </div>
      </div>

      {/* Plot status pills */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Plot Status Overview</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-green-50 rounded-2xl py-3 text-center">
            <p className="text-xl font-extrabold text-green-600 font-syne">{healthyCount}</p>
            <p className="text-[9px] font-bold text-green-500 uppercase mt-0.5">Healthy</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-2xl py-3 text-center">
            <p className="text-xl font-extrabold text-amber-500 font-syne">{warningCount}</p>
            <p className="text-[9px] font-bold text-amber-500 uppercase mt-0.5">Warning</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-2xl py-3 text-center">
            <p className="text-xl font-extrabold text-red-500 font-syne">{dangerCount}</p>
            <p className="text-[9px] font-bold text-red-400 uppercase mt-0.5">Critical</p>
          </div>
        </div>
      </div>

      {/* Recent Diagnostics */}
      <div>
        <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Diagnostics</h3>
        {scanHistory.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No scans yet. Use the Scan tab to get started.</p>
        ) : (
          <div className="space-y-2">
            {scanHistory.map((scan) => (
              <div key={scan.id} className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
                {scan.bg && (
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${scan.bg})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-800 truncate">{scan.crop}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{scan.disease} · {scan.confidence}%</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{scan.date}</p>
                </div>
                {scan.severity === 'danger' || scan.severity === 'warning' ? (
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-full flex-shrink-0">⚠ Risk</span>
                ) : (
                  <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded-full flex-shrink-0">✓ OK</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
