import React from 'react';
import { CloudRain, Thermometer, Droplets, Wind, Sun, Globe2, CloudDrizzle, Cloud } from 'lucide-react';

const forecast = [
  { day: 'Today', icon: <CloudRain size={20} className="text-blue-400" />,    high: 29, low: 21, rain: 80, risk: 'High',   riskColor: 'text-red-500'   },
  { day: 'Thu',   icon: <CloudDrizzle size={20} className="text-blue-300" />, high: 27, low: 20, rain: 60, risk: 'High',   riskColor: 'text-red-500'   },
  { day: 'Fri',   icon: <Cloud size={20} className="text-slate-400" />,       high: 25, low: 18, rain: 30, risk: 'Med',    riskColor: 'text-amber-500' },
  { day: 'Sat',   icon: <Sun size={20} className="text-amber-400" />,         high: 28, low: 19, rain: 10, risk: 'Low',    riskColor: 'text-green-500' },
  { day: 'Sun',   icon: <Sun size={20} className="text-amber-400" />,         high: 30, low: 20, rain: 5,  risk: 'Low',    riskColor: 'text-green-500' },
];

const metrics = [
  { icon: <Droplets size={18} className="text-blue-500" />,  label: 'Humidity',      value: '89%',      high: true  },
  { icon: <Wind size={18} className="text-slate-400" />,     label: 'Wind Speed',    value: '12 km/h',  high: false },
  { icon: <Sun size={18} className="text-amber-500" />,      label: 'UV Index',      value: '6 — High', high: true  },
  { icon: <Globe2 size={18} className="text-green-600" />,   label: 'Soil Moisture', value: '73%',      high: false },
];

export default function RiskModel() {
  return (
    <div className="space-y-4">
      {/* Weather hero */}
      <div className="bg-forest-mid text-white p-6 rounded-[28px] shadow-lg text-center relative overflow-hidden">
        <div className="absolute w-48 h-48 rounded-full bg-brand-mint/15 -top-16 -right-16 pointer-events-none" />
        <CloudRain size={80} className="absolute -bottom-4 -left-4 opacity-10" />
        <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-3">
          Microclimate Array · Sector 4
        </p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Thermometer size={28} className="text-green-300" />
          <h2 className="font-syne text-5xl font-extrabold tracking-tighter">29.4°C</h2>
        </div>
        <p className="text-sm font-medium text-green-200 mt-2">⚠ Conditions favor fungal outbreaks</p>
      </div>

      {/* 5-day forecast */}
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">5-Day Disease Forecast</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {forecast.map((f) => (
            <div key={f.day} className="flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-3 w-[76px] flex flex-col items-center gap-1.5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500">{f.day}</p>
              {f.icon}
              <p className="text-xs font-extrabold text-slate-800">{f.high}°</p>
              <p className="text-[9px] text-slate-400">{f.low}°</p>
              <div className="w-full h-px bg-slate-100 my-0.5" />
              <p className="text-[9px] font-bold text-blue-400">{f.rain}%</p>
              <p className={`text-[9px] font-extrabold ${f.riskColor}`}>{f.risk}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics list */}
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Environmental Metrics</p>
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          {metrics.map((m, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
              <div className="flex items-center gap-3 text-slate-600">
                {m.icon}
                <span className="text-sm font-semibold">{m.label}</span>
              </div>
              <span className={`text-sm font-extrabold ${m.high ? 'text-red-500' : 'text-slate-800'}`}>
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-[24px] p-5">
        <p className="text-[9px] font-bold text-orange-700 uppercase tracking-widest mb-2">Risk Forecast — 48h</p>
        <p className="text-xs text-orange-900 leading-relaxed">
          High humidity combined with elevated temperatures creates optimal conditions for fungal
          propagation. Recommend preventive treatment of Sector 4 before rain forecast on Thursday.
        </p>
      </div>
    </div>
  );
}
