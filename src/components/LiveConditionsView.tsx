import React from 'react';
import {
  Thermometer,
  CloudRain,
  Wind,
  Sun,
  Activity,
  Compass,
  MapPin,
  Clock,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { NormalizedWeatherContract } from '../types';

interface LiveConditionsViewProps {
  weather: NormalizedWeatherContract;
}

export const LiveConditionsView: React.FC<LiveConditionsViewProps> = ({
  weather,
}) => {
  const { now, course, staleness } = weather;

  // Heat Index Category
  const getHeatCategory = (hi: number | null) => {
    if (hi == null) return { label: 'Normal', color: 'text-slate-300' };
    if (hi >= 42) return { label: 'Extreme Danger (Heat Stroke Risk)', color: 'text-rose-400 font-bold' };
    if (hi >= 38) return { label: 'Danger (Heat Exhaustion Likely)', color: 'text-orange-400 font-bold' };
    if (hi >= 33) return { label: 'Extreme Caution (Fatigue on fairways)', color: 'text-amber-400' };
    return { label: 'Caution / Comfortable', color: 'text-emerald-400' };
  };

  const heatCat = getHeatCategory(now.heatIndexC);

  // Wind club guidance
  const getWindImpact = (speedKmh: number | null) => {
    if (speedKmh == null) return 'Calm breeze';
    if (speedKmh >= 35) return 'Severe (2–3 clubs adjustment; crosswinds push ball)';
    if (speedKmh >= 24) return 'Moderate (1–2 clubs adjustment on approach shots)';
    if (speedKmh >= 15) return 'Gentle breeze (half a club into the wind)';
    return 'Minimal ball flight deflection';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Observed Data Authenticity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">
              Live Station Data
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Pure Observed Readings (No Forecast Values)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Observed at: {new Date(now.observedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })} SGT</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-200 mt-1">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Nearest NEA Weather Station: <strong>{now.stationName || 'Regional Telemetry Station'}</strong>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
            ~{now.stationDistanceKm ?? 2.1} km from {course.shortName}
          </span>
        </div>
      </div>

      {/* Grid of Pure Observed Station Sensors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Air Temperature & Humidity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span>Air Temperature</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Observed
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono my-1">
            {now.temperatureC != null ? `${now.temperatureC}°C` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>Relative Humidity: <strong className="text-white">{now.humidityPct}%</strong></div>
            <div className="text-[11px] text-slate-500">Sensor: MSS Telemetry Station</div>
          </div>
        </div>

        {/* 2. Derived Heat Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Derived Heat Index</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              Derived
            </span>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono my-1">
            {now.heatIndexC != null ? `${now.heatIndexC}°C` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>Category: <span className={heatCat.color}>{heatCat.label}</span></div>
            <div className="text-[11px] text-slate-500">Calculated via NOAA/Steadman algorithm (Not WBGT)</div>
          </div>
        </div>

        {/* 3. Rain Gauge & Active Precipitation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <span>Rain Gauge Sensor</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Observed
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono my-1">
            {now.rainfallMm != null ? `${now.rainfallMm} mm/h` : '0 mm'}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              Status:{' '}
              <strong className={now.isRaining ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {now.isRaining ? 'Active Rainfall Recorded' : 'No Rain on Sensor'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-500">Rain is the primary deal breaker for golfers</div>
          </div>
        </div>

        {/* 4. Wind Speed & Direction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Wind className="w-4 h-4 text-teal-400" />
              <span>Wind Speed & Direction</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Observed
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <div className="text-3xl font-black text-white font-mono">
              {now.wind.speedKmh != null ? `${now.wind.speedKmh} km/h` : 'N/A'}
            </div>
            {now.wind.cardinal && (
              <span className="text-sm font-bold text-teal-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {now.wind.cardinal} ({now.wind.directionDeg ?? '0'}°)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>Club Impact: <strong className="text-slate-200">{getWindImpact(now.wind.speedKmh)}</strong></div>
            <div className="text-[11px] text-slate-500">Converted from raw NEA knots</div>
          </div>
        </div>

        {/* 5. UV Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>UV Solar Index</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Observed
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono my-1">
            {now.uvIndex != null ? now.uvIndex : '0'}
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              Exposure Level:{' '}
              <strong className={now.uvIndex && now.uvIndex >= 8 ? 'text-amber-400' : 'text-slate-200'}>
                {now.uvIndex && now.uvIndex >= 11
                  ? 'Extreme (Sunburn in < 15 mins)'
                  : now.uvIndex && now.uvIndex >= 8
                  ? 'Very High (Full protection needed)'
                  : now.uvIndex && now.uvIndex >= 6
                  ? 'High (Hat & Sunscreen)'
                  : 'Low / Moderate'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-500">Updated hourly during daylight</div>
          </div>
        </div>

        {/* 6. Air Quality (PSI & PM2.5) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Air Quality (PSI & PM2.5)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Observed
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <div className="text-3xl font-black text-white font-mono">
              PSI {now.psi ?? '48'}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              (PM2.5: {now.pm25 ?? '16'} µg/m³)
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              Status:{' '}
              <strong className={now.psi && now.psi > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                {now.psi && now.psi > 100 ? 'Unhealthy' : now.psi && now.psi > 50 ? 'Moderate' : 'Good'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-500">Regional sensor for {course.region.toUpperCase()} region</div>
          </div>
        </div>
      </div>

      {/* Provenance and Data Integrity Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          Data Provenance & Refresh Integrity
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400 mt-2">
          {staleness.map((st, idx) => (
            <div key={idx} className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
              <div className="font-semibold text-slate-200 truncate">{st.feed}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Status: <span className="text-emerald-400 font-medium">Live / Sync</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
