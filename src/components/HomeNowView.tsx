import React from 'react';
import {
  Sparkles,
  CloudRain,
  Zap,
  Thermometer,
  Wind,
  Sun,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Compass,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import { NormalizedWeatherContract } from '../types';
import { getBandDetails } from '../utils/golfScore';

interface HomeNowViewProps {
  weather: NormalizedWeatherContract;
  onNavigateToTab: (tab: 'today' | 'outlook' | 'live') => void;
  onOpenPeriodDetail: (period: any, title: string) => void;
  holeMode: 9 | 18;
}

export const HomeNowView: React.FC<HomeNowViewProps> = ({
  weather,
  onNavigateToTab,
  onOpenPeriodDetail,
  holeMode,
}) => {
  const { now, next2h, next24h, course } = weather;
  const score = next2h.score;
  const band = getBandDetails(weather.next2h.score >= 90 ? 'excellent' : weather.next2h.score >= 75 ? 'good' : weather.next2h.score >= 60 ? 'fair' : weather.next2h.score >= 40 ? 'poor' : 'avoid');

  // Decision details
  const getDecisionBadge = () => {
    switch (next2h.decision) {
      case 'play':
        return {
          label: 'PLAY NOW',
          desc: 'Green light. Conditions are prime for teeing off.',
          bg: 'bg-emerald-600',
          ring: 'ring-emerald-400',
          textColor: 'text-emerald-500',
          icon: <ShieldCheck className="w-5 h-5 text-white" />,
        };
      case 'wait':
        return {
          label: 'WAIT / DELAY',
          desc: 'Passing showers or rain risk. Wait 20–30 mins or prepare wet weather gear.',
          bg: 'bg-amber-600',
          ring: 'ring-amber-400',
          textColor: 'text-amber-500',
          icon: <Clock className="w-5 h-5 text-white" />,
        };
      case 'abandon':
      default:
        return {
          label: 'ABANDON / DO NOT TEE OFF',
          desc: 'Thunderstorm warning or active downpour. Stay in clubhouse.',
          bg: 'bg-rose-600',
          ring: 'ring-rose-400',
          textColor: 'text-rose-500',
          icon: <ShieldAlert className="w-5 h-5 text-white" />,
        };
    }
  };

  const decision = getDecisionBadge();

  return (
    <div className="space-y-5">
      {/* Primary Hero Decision Card */}
      <div
        id="card-hero-golfability"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: band.accentColor }}
        />

        <div className="relative z-10">
          {/* Top meta: horizon indicator */}
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Now & Next 2 Hours
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {course.forecastArea} Area ({course.name})
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
              <span>Horizon:</span>
              <span className="text-white font-semibold">Immediate</span>
            </div>
          </div>

          {/* Core Score & Decision Hero Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score Dial / Number */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono"
                  id="score-golfability-value"
                >
                  {score}
                </span>
                <span className="text-slate-400 text-lg font-bold">/100</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${band.badgeBg} ${band.badgeText} shadow-md`}
                >
                  {band.label} — {band.action}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs">{band.meaning}</p>
            </div>

            {/* Verdict & 2-Hour Action Block */}
            <div className="md:col-span-8 bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 ${decision.bg}`}
                >
                  {decision.icon}
                  {decision.label}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  [Next 2h: {next2h.validFrom.slice(11, 16)}–{next2h.validTo.slice(11, 16)}]
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                {decision.desc}
              </p>

              {/* 3 Key Drivers */}
              <div className="mt-3 pt-3 border-t border-slate-700/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Score Drivers (Why {score}/100):
                </div>
                <ul className="space-y-1">
                  {next2h.drivers.map((driver, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 flex items-start gap-1.5"
                    >
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick 2-Hour Forecast Snippet */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="font-semibold text-white">2-Hr Weather:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-medium border border-slate-700">
                  {next2h.forecastLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span>Thunderstorm Risk:</span>
                <span
                  className={`font-semibold capitalize ${
                    next2h.thunderstormRisk === 'likely'
                      ? 'text-rose-400'
                      : next2h.thunderstormRisk === 'possible'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {next2h.thunderstormRisk}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                onOpenPeriodDetail(
                  {
                    timeLabel: 'Next 2 Hours Nowcast',
                    forecastLabel: next2h.forecastLabel,
                    golfability: { score, band: next2h.score >= 90 ? 'excellent' : next2h.score >= 75 ? 'good' : 'fair', drivers: next2h.drivers },
                    temperatureRangeC: [now.temperatureC || 30, (now.temperatureC || 30) + 2],
                    humidityRangePct: [now.humidityPct || 70, (now.humidityPct || 70) + 5],
                    windSpeedRangeKmh: [now.wind.speedKmh || 10, (now.wind.speedKmh || 10) + 5],
                  },
                  'Now / 2-Hour Nowcast Breakdown'
                )
              }
              id="btn-inspect-nowcast"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
            >
              <span>Audit Score Factors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Observed Live Conditions Snapshot Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Station Readings
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Observed
            </span>
          </div>
          <button
            onClick={() => onNavigateToTab('live')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
          >
            <span>All Station Data</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {/* Air Temp */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span>Air Temp</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {now.temperatureC != null ? `${now.temperatureC}°C` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400">RH: {now.humidityPct}%</div>
          </div>

          {/* Derived Heat Index */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Thermometer className="w-3 h-3 text-rose-400" />
              <span>Heat Index</span>
              <span className="text-[9px] text-amber-400 font-mono">[Derived]</span>
            </div>
            <div className="text-base font-bold text-rose-400 font-mono">
              {now.heatIndexC != null ? `${now.heatIndexC}°C` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400">
              {now.heatIndexC && now.heatIndexC >= 38 ? 'High heat stress' : 'Moderate'}
            </div>
          </div>

          {/* Rain Gauge */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <CloudRain className="w-3 h-3 text-sky-400" />
              <span>Rain Gauge</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {now.rainfallMm != null ? `${now.rainfallMm} mm/h` : '0 mm'}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              {now.isRaining ? 'Raining now' : 'Dry on course'}
            </div>
          </div>

          {/* Wind */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Wind className="w-3 h-3 text-teal-400" />
              <span>Wind Speed</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {now.wind.speedKmh != null ? `${now.wind.speedKmh} km/h` : 'Light'}
            </div>
            <div className="text-[10px] text-slate-400">
              {now.wind.cardinal ? `Dir: ${now.wind.cardinal}` : 'Gentle breeze'}
            </div>
          </div>

          {/* UV Index */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>UV Index</span>
            </div>
            <div className="text-base font-bold text-amber-400 font-mono">
              {now.uvIndex != null ? now.uvIndex : '0'}
            </div>
            <div className="text-[10px] text-slate-400">
              {now.uvIndex && now.uvIndex >= 8 ? 'Very High UV' : 'Moderate'}
            </div>
          </div>

          {/* Air Quality (PSI) */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span>PSI & PM2.5</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              PSI {now.psi ?? '45'}
            </div>
            <div className="text-[10px] text-slate-400">
              PM2.5: {now.pm25 ?? '15'} µg/m³
            </div>
          </div>
        </div>
      </div>

      {/* Decision Flow Navigation Cards (matching attached Miro flow) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Today Tee Times */}
        <button
          onClick={() => onNavigateToTab('today')}
          id="nav-card-today-view"
          className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              24-Hr Windows
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
            Today's Tee Times
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            2-hour nowcast merged with 24-hour periods to find the best tee-time slot.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <span>Explore periods</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </button>

        {/* Card 2: 4-Day Outlook */}
        <button
          onClick={() => onNavigateToTab('outlook')}
          id="nav-card-outlook-view"
          className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-600/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              4-Day Horizon
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition">
            4-Day Planning Outlook
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Daily golfability scores with visible meteorological uncertainty indicators.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal-400">
            <span>View 4 days</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </button>

        {/* Card 3: Live Station Data */}
        <button
          onClick={() => onNavigateToTab('live')}
          id="nav-card-live-view"
          className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 text-left transition group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-600/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Pure Station Data
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
            Live Observed Conditions
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Nearest NEA weather station readings: rain gauge, wind, temp, and UV.
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-400">
            <span>View station sensors</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </button>
      </div>
    </div>
  );
};
