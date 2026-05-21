import React, { useState } from 'react';
import {
  CloudRain, Thermometer, Droplets, Wind, Sun, Globe2,
  Cloud, CloudDrizzle, Sprout, X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// ─── static data ──────────────────────────────────────────────────────────────

const FORECAST = [
  { day: 'Today', icon: <CloudRain    size={20} className="text-blue-400"  />, high: 29, low: 21, rain: 80, risk: 'High', riskColor: 'text-red-500'   },
  { day: 'Thu',   icon: <CloudDrizzle size={20} className="text-blue-300"  />, high: 27, low: 20, rain: 60, risk: 'High', riskColor: 'text-red-500'   },
  { day: 'Fri',   icon: <Cloud        size={20} className="text-slate-400" />, high: 25, low: 18, rain: 30, risk: 'Med',  riskColor: 'text-amber-500' },
  { day: 'Sat',   icon: <Sun          size={20} className="text-amber-400" />, high: 28, low: 19, rain: 10, risk: 'Low',  riskColor: 'text-green-500' },
  { day: 'Sun',   icon: <Sun          size={20} className="text-amber-400" />, high: 30, low: 20, rain:  5, risk: 'Low',  riskColor: 'text-green-500' },
];

const METRICS = [
  { icon: <Droplets size={17} className="text-blue-500" />,  label: 'Humidity',      value: '89%',      high: true  },
  { icon: <Wind     size={17} className="text-slate-400" />, label: 'Wind Speed',    value: '12 km/h',  high: false },
  { icon: <Sun      size={17} className="text-amber-500" />, label: 'UV Index',      value: '6 — High', high: true  },
  { icon: <Globe2   size={17} className="text-green-600" />, label: 'Soil Moisture', value: '73%',      high: false },
];

const TREATMENTS = [
  {
    id: 1, disease: 'Early Blight', crop: 'Tomato', severity: 'High',
    chemical: { name: 'Copper Oxychloride', dose: '3 g / L water', freq: 'Every 7 days' },
    organic:  { name: 'Neem Oil Solution',  dose: '5 ml / L water', freq: 'Every 5 days' },
    prevention: 'Ensure proper plant spacing. Avoid overhead irrigation. Remove and destroy infected leaves immediately.',
  },
  {
    id: 2, disease: 'Common Rust', crop: 'Corn', severity: 'Medium',
    chemical: { name: 'Mancozeb 80WP',          dose: '2.5 g / L water', freq: 'Every 10 days' },
    organic:  { name: 'Potassium Bicarbonate',   dose: '4 g / L water',   freq: 'Every 7 days'  },
    prevention: 'Plant resistant varieties. Ensure proper field drainage. Rotate crops annually.',
  },
  {
    id: 3, disease: 'Leaf Curl Virus', crop: 'Pepper', severity: 'Medium',
    chemical: { name: 'Imidacloprid (aphid control)', dose: '1 ml / L water', freq: 'Every 14 days' },
    organic:  { name: 'Neem + Garlic Spray',          dose: '10 ml / L water', freq: 'Every 7 days' },
    prevention: 'Control vector insects (aphids/whiteflies). Remove infected plants early. Use virus-resistant cultivars.',
  },
  {
    id: 4, disease: 'Bacterial Blight', crop: 'Rice', severity: 'Low',
    chemical: { name: 'Copper Hydroxide',  dose: '3 g / L water', freq: 'Every 10 days' },
    organic:  { name: 'Trichoderma Spray', dose: '5 g / L water',  freq: 'Every 7 days'  },
    prevention: 'Avoid excessive nitrogen fertilisation. Drain fields periodically. Use certified disease-free seeds.',
  },
];

const SEVERITY_STYLE = {
  High:   'bg-red-50   text-red-600   border-red-200',
  Medium: 'bg-amber-50 text-amber-600 border-amber-200',
  Low:    'bg-green-50 text-green-600 border-green-200',
};

const STATUS_CFG = {
  healthy: { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500', bar: 'bg-green-500',  text: 'text-green-700',  label: 'Healthy'  },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500',  text: 'text-amber-700',  label: 'Warning'  },
  danger:  { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',   bar: 'bg-red-500',    text: 'text-red-600',    label: 'Critical' },
};

// ─── Weather tab ──────────────────────────────────────────────────────────────
function WeatherTab() {
  return (
    <div className="space-y-4">
      <div className="bg-forest-mid text-white p-6 rounded-[24px] shadow-lg text-center relative overflow-hidden">
        <div className="absolute w-48 h-48 rounded-full bg-brand-mint/15 -top-16 -right-16 pointer-events-none" />
        <CloudRain size={72} className="absolute -bottom-4 -left-4 opacity-10" />
        <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-3">Microclimate Array · Sector 4</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Thermometer size={26} className="text-green-300" />
          <h2 className="font-syne text-5xl font-extrabold tracking-tighter">29.4°C</h2>
        </div>
        <p className="text-sm font-medium text-green-200">⚠ Conditions favour fungal outbreaks</p>
      </div>

      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">5-Day Disease Forecast</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FORECAST.map(f => (
            <div key={f.day} className="flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-3 w-[76px] flex flex-col items-center gap-1.5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500">{f.day}</p>
              {f.icon}
              <p className="text-xs font-extrabold text-slate-800">{f.high}°</p>
              <p className="text-[9px] text-slate-400">{f.low}°</p>
              <div className="w-full h-px bg-slate-100" />
              <p className="text-[9px] font-bold text-blue-400">{f.rain}%</p>
              <p className={`text-[9px] font-extrabold ${f.riskColor}`}>{f.risk}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {METRICS.map((m, i) => (
          <div key={i} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
            <div className="flex items-center gap-3 text-slate-600">
              {m.icon}
              <span className="text-sm font-semibold">{m.label}</span>
            </div>
            <span className={`text-sm font-extrabold ${m.high ? 'text-red-500' : 'text-slate-800'}`}>{m.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-5">
        <p className="text-[9px] font-bold text-orange-700 uppercase tracking-widest mb-2">Risk Forecast — 48h</p>
        <p className="text-xs text-orange-900 leading-relaxed">
          High humidity combined with elevated temperatures creates optimal conditions for fungal propagation.
          Recommend preventive treatment of Sector 4 before rain forecast on Thursday.
        </p>
      </div>
    </div>
  );
}

// ─── Plots tab ────────────────────────────────────────────────────────────────
function PlotsTab() {
  const { fieldPlots } = useAppContext();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {fieldPlots.map(plot => {
          const c = STATUS_CFG[plot.status];
          return (
            <button
              key={plot.id}
              onClick={() => setSelected(plot)}
              className={`${c.bg} border ${c.border} p-4 rounded-[18px] text-left w-full transition-transform active:scale-[0.97]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <span className={`text-[9px] font-bold uppercase ${c.text}`}>{c.label}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sprout size={11} className="text-slate-400 flex-shrink-0" />
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

      {/* Detail bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[28px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${STATUS_CFG[selected.status].text}`}>
                  {STATUS_CFG[selected.status].label}
                </p>
                <h3 className="font-syne font-extrabold text-lg text-slate-800 mt-0.5">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="flex gap-3 mb-4">
              {[
                { label: 'Health', value: `${selected.health}%` },
                { label: 'Crop',   value: selected.crop },
                { label: 'Zone',   value: selected.sector },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
                  <p className="font-extrabold text-slate-800 font-syne text-sm">{value}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className={`${STATUS_CFG[selected.status].bg} border ${STATUS_CFG[selected.status].border} rounded-2xl p-4`}>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Health Index</span>
                <span className={STATUS_CFG[selected.status].text}>{selected.health}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className={`h-full ${STATUS_CFG[selected.status].bar} rounded-full`} style={{ width: `${selected.health}%` }} />
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">Last scan: {selected.lastScan}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Treatments tab ───────────────────────────────────────────────────────────
function TreatmentsTab() {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-3">
      {TREATMENTS.map(t => (
        <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setOpen(open === t.id ? null : t.id)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm text-slate-800">{t.disease}</p>
                <span className={`text-[9px] font-bold border rounded-full px-2 py-0.5 ${SEVERITY_STYLE[t.severity]}`}>
                  {t.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.crop}</p>
            </div>
            <span className="text-slate-400 text-lg">{open === t.id ? '−' : '+'}</span>
          </button>

          {open === t.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
              {/* Chemical */}
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">Chemical</p>
                <p className="font-bold text-sm text-slate-800">{t.chemical.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Dose: {t.chemical.dose} · {t.chemical.freq}</p>
              </div>
              {/* Organic */}
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-green-700 uppercase tracking-widest mb-1.5">Organic Alternative</p>
                <p className="font-bold text-sm text-slate-800">{t.organic.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Dose: {t.organic.dose} · {t.organic.freq}</p>
              </div>
              {/* Prevention */}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Prevention</p>
                <p className="text-xs text-slate-600 leading-relaxed">{t.prevention}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
const TABS = ['Weather', 'My Plots', 'Treatments'];

export default function ResourceHub() {
  const [activeTab, setActiveTab] = useState('Weather');

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-syne font-extrabold text-xl text-slate-800">Resource Hub</h2>
        <p className="text-xs text-slate-400 mt-0.5">Weather, field data &amp; treatment protocols</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-slate-200 p-1 rounded-2xl mb-5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-white text-forest-mid shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Weather'    && <WeatherTab />}
      {activeTab === 'My Plots'   && <PlotsTab />}
      {activeTab === 'Treatments' && <TreatmentsTab />}
    </div>
  );
}
