import React, { useState, useEffect } from 'react';
import {
  CloudRain, Thermometer, Droplets, Wind, Sun,
  Cloud, CloudDrizzle, Sprout, X, Loader2, MapPin, AlertTriangle,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { weatherService } from '../services/weatherService';

// ─── Weather code helpers ─────────────────────────────────────────────────────

function weatherInfo(code) {
  if (code === 0)  return { label: 'Clear Sky',      Icon: Sun,          color: 'text-amber-400' };
  if (code <= 3)   return { label: 'Partly Cloudy',  Icon: Cloud,        color: 'text-slate-400' };
  if (code <= 48)  return { label: 'Foggy',          Icon: Cloud,        color: 'text-slate-400' };
  if (code <= 55)  return { label: 'Light Drizzle',  Icon: CloudDrizzle, color: 'text-blue-300'  };
  if (code <= 65)  return { label: 'Rainy',          Icon: CloudRain,    color: 'text-blue-400'  };
  if (code <= 82)  return { label: 'Rain Showers',   Icon: CloudRain,    color: 'text-blue-500'  };
  return           { label: 'Stormy',                Icon: CloudRain,    color: 'text-purple-400' };
}

function dayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
}

function riskColor(level) {
  return level === 'High' ? 'text-red-500' : level === 'Moderate' ? 'text-amber-500' : 'text-green-500';
}

// ─── Weather tab ──────────────────────────────────────────────────────────────
function WeatherTab() {
  const [current,  setCurrent]  = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadWeather = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const [cur, fcast] = await Promise.all([
            weatherService.getCurrentConditions(coords.latitude, coords.longitude),
            weatherService.getForecast(coords.latitude, coords.longitude, 5),
          ]);
          setCurrent(cur);
          setForecast(fcast.forecast || []);
        } catch {
          setError('Weather service unavailable. Try again later.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied. Allow location to see real weather data.');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => { loadWeather(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <Loader2 size={28} className="animate-spin text-forest-mid" />
      <p className="text-sm">Getting your location…</p>
    </div>
  );

  if (error) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
      <MapPin size={28} className="mx-auto text-amber-500" />
      <p className="text-sm font-bold text-amber-800">Location Needed</p>
      <p className="text-xs text-amber-700 leading-relaxed">{error}</p>
      <button onClick={loadWeather} className="bg-forest-mid text-white text-xs font-bold px-5 py-2.5 rounded-xl">
        Try Again
      </button>
    </div>
  );

  const { label: condLabel, Icon: CondIcon } = weatherInfo(current.weatherCode);

  return (
    <div className="space-y-4">
      {/* Current conditions hero */}
      <div className="bg-forest-mid text-white p-6 rounded-[24px] shadow-lg text-center relative overflow-hidden">
        <div className="absolute w-48 h-48 rounded-full bg-brand-mint/15 -top-16 -right-16 pointer-events-none" />
        <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-3">
          Your Location · Live
        </p>
        <div className="flex items-center justify-center gap-3 mb-1">
          <Thermometer size={26} className="text-green-300" />
          <h2 className="font-syne text-5xl font-extrabold tracking-tighter">
            {current.temperature}°C
          </h2>
        </div>
        <p className="text-sm font-medium text-green-200 mb-2">{condLabel}</p>
        <p className={`text-sm font-bold ${current.riskLevel === 'High' ? 'text-red-300' : current.riskLevel === 'Moderate' ? 'text-amber-300' : 'text-green-300'}`}>
          {current.riskLevel === 'High' ? '⚠ High disease risk conditions' :
           current.riskLevel === 'Moderate' ? '⚡ Moderate disease risk' :
           '✓ Low disease risk today'}
        </p>
      </div>

      {/* 5-day forecast */}
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">5-Day Disease Forecast</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {forecast.map((f, i) => {
            const { Icon: DayIcon, color } = weatherInfo(f.weatherCode);
            const risk = f.diseaseRisk < 30 ? 'Low' : f.diseaseRisk < 60 ? 'Med' : 'High';
            return (
              <div key={f.date} className="flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-3 w-[76px] flex flex-col items-center gap-1.5 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500">{dayLabel(f.date, i)}</p>
                <DayIcon size={20} className={color} />
                <p className="text-xs font-extrabold text-slate-800">{Math.round(f.tempMax)}°</p>
                <p className="text-[9px] text-slate-400">{Math.round(f.tempMin)}°</p>
                <div className="w-full h-px bg-slate-100" />
                <p className="text-[9px] font-bold text-blue-400">{Math.round(f.precipitation)}mm</p>
                <p className={`text-[9px] font-extrabold ${riskColor(risk)}`}>{risk}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {[
          { Icon: Droplets, label: 'Humidity',    value: `${current.humidity}%`,      warn: current.humidity >= 70 },
          { Icon: Wind,     label: 'Wind Speed',  value: `${current.windSpeed} km/h`, warn: false },
          { Icon: CloudRain, label: 'Rain',       value: `${current.rain} mm`,         warn: current.rain > 0 },
        ].map(({ Icon, label, value, warn }, i) => (
          <div key={label} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
            <div className="flex items-center gap-3 text-slate-600">
              <Icon size={17} className="text-blue-500" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <span className={`text-sm font-extrabold ${warn ? 'text-red-500' : 'text-slate-800'}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Risk advisory */}
      {current.riskLevel !== 'Low' && (
        <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-5">
          <p className="text-[9px] font-bold text-orange-700 uppercase tracking-widest mb-2">Risk Advisory</p>
          <p className="text-xs text-orange-900 leading-relaxed">
            {current.humidity >= 70 && current.rain > 0
              ? 'High humidity and recent rain create ideal conditions for fungal disease spread. Consider preventive fungicide application on susceptible crops.'
              : current.humidity >= 70
              ? 'High humidity favours fungal growth. Ensure good air circulation and avoid overhead irrigation.'
              : 'Warm temperatures combined with current conditions may increase disease pressure. Monitor crops closely.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── My Crops tab (derived from real scan history) ────────────────────────────
const STATUS_CFG = {
  healthy: { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500', bar: 'bg-green-500',  text: 'text-green-700',  label: 'Healthy'  },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500',  text: 'text-amber-700',  label: 'Warning'  },
  danger:  { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',   bar: 'bg-red-500',    text: 'text-red-600',    label: 'Critical' },
};

function PlotsTab() {
  const { fieldPlots } = useAppContext();
  const [selected, setSelected] = useState(null);

  if (fieldPlots.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <Sprout size={36} className="mx-auto mb-3 text-slate-300" />
      <p className="font-bold text-sm text-slate-500">No crops scanned yet</p>
      <p className="text-xs mt-1">Your scanned crops will appear here automatically</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {fieldPlots.map(plot => {
          const c = STATUS_CFG[plot.status] || STATUS_CFG.healthy;
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
              <p className="text-[9px] text-slate-400 mt-2">Last scan: {plot.lastScan}</p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[28px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${(STATUS_CFG[selected.status] || STATUS_CFG.healthy).text}`}>
                  {(STATUS_CFG[selected.status] || STATUS_CFG.healthy).label}
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
            <div className={`${(STATUS_CFG[selected.status] || STATUS_CFG.healthy).bg} border ${(STATUS_CFG[selected.status] || STATUS_CFG.healthy).border} rounded-2xl p-4`}>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Health Index</span>
                <span className={(STATUS_CFG[selected.status] || STATUS_CFG.healthy).text}>{selected.health}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className={`h-full ${(STATUS_CFG[selected.status] || STATUS_CFG.healthy).bar} rounded-full`} style={{ width: `${selected.health}%` }} />
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
const TREATMENTS = [
  {
    id: 1, disease: 'Early Blight', crop: 'Tomato', severity: 'High',
    chemical: { name: 'Copper Oxychloride', dose: '3 g / L water', freq: 'Every 7 days' },
    organic:  { name: 'Neem Oil Solution',  dose: '5 ml / L water', freq: 'Every 5 days' },
    prevention: 'Ensure proper plant spacing. Avoid overhead irrigation. Remove and destroy infected leaves immediately.',
  },
  {
    id: 2, disease: 'Common Rust', crop: 'Corn', severity: 'Medium',
    chemical: { name: 'Mancozeb 80WP',        dose: '2.5 g / L water', freq: 'Every 10 days' },
    organic:  { name: 'Potassium Bicarbonate', dose: '4 g / L water',   freq: 'Every 7 days'  },
    prevention: 'Plant resistant varieties. Ensure proper field drainage. Rotate crops annually.',
  },
  {
    id: 3, disease: 'Leaf Curl Virus', crop: 'Pepper', severity: 'Medium',
    chemical: { name: 'Imidacloprid (aphid control)', dose: '1 ml / L water',  freq: 'Every 14 days' },
    organic:  { name: 'Neem + Garlic Spray',          dose: '10 ml / L water', freq: 'Every 7 days'  },
    prevention: 'Control vector insects (aphids/whiteflies). Remove infected plants early. Use virus-resistant cultivars.',
  },
  {
    id: 4, disease: 'Bacterial Blight', crop: 'Rice', severity: 'Low',
    chemical: { name: 'Copper Hydroxide',  dose: '3 g / L water', freq: 'Every 10 days' },
    organic:  { name: 'Trichoderma Spray', dose: '5 g / L water',  freq: 'Every 7 days'  },
    prevention: 'Avoid excessive nitrogen fertilisation. Drain fields periodically. Use certified disease-free seeds.',
  },
  {
    id: 5, disease: 'Late Blight', crop: 'Potato / Tomato', severity: 'High',
    chemical: { name: 'Mancozeb or Chlorothalonil', dose: '2.5 g / L water', freq: 'Every 7 days' },
    organic:  { name: 'Copper-based fungicide',     dose: '3 g / L water',   freq: 'Every 5 days' },
    prevention: 'Avoid overhead irrigation. Destroy infected material — do not compost. Monitor neighbouring plants.',
  },
  {
    id: 6, disease: 'Powdery Mildew', crop: 'Various', severity: 'Medium',
    chemical: { name: 'Sulfur-based fungicide', dose: '2 g / L water', freq: 'Every 10 days' },
    organic:  { name: 'Baking Soda Spray',      dose: '5 g / L water', freq: 'Every 7 days'  },
    prevention: 'Improve air circulation. Avoid excess nitrogen fertiliser. Water at base, not on leaves.',
  },
];

const SEVERITY_STYLE = {
  High:   'bg-red-50   text-red-600   border-red-200',
  Medium: 'bg-amber-50 text-amber-600 border-amber-200',
  Low:    'bg-green-50 text-green-600 border-green-200',
};

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
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">Chemical</p>
                <p className="font-bold text-sm text-slate-800">{t.chemical.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Dose: {t.chemical.dose} · {t.chemical.freq}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-green-700 uppercase tracking-widest mb-1.5">Organic Alternative</p>
                <p className="font-bold text-sm text-slate-800">{t.organic.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Dose: {t.organic.dose} · {t.organic.freq}</p>
              </div>
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
const TABS = ['Weather', 'My Crops', 'Treatments'];

export default function ResourceHub() {
  const [activeTab, setActiveTab] = useState('Weather');
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-syne font-extrabold text-xl text-slate-800">Resource Hub</h2>
        <p className="text-xs text-slate-400 mt-0.5">Weather, crop health &amp; treatment protocols</p>
      </div>
      <div className="flex bg-slate-200 p-1 rounded-2xl mb-5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab ? 'bg-white text-forest-mid shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Weather'    && <WeatherTab />}
      {activeTab === 'My Crops'   && <PlotsTab />}
      {activeTab === 'Treatments' && <TreatmentsTab />}
    </div>
  );
}
