import React from 'react';
import {
  Clock,
  Sun,
  CloudRain,
  Zap,
  Wind,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { NormalizedWeatherContract, PeriodForecast } from '../types';
import { getBandDetails } from '../utils/golfScore';

interface TodayViewProps {
  weather: NormalizedWeatherContract;
  onOpenPeriodDetail: (period: any, title: string) => void;
  holeMode: 9 | 18;
}

export const TodayView: React.FC<TodayViewProps> = ({
  weather,
  onOpenPeriodDetail,
  holeMode,
}) => {
  const { next2h, next24h, recommendedWindows, course, daylight } = weather;

  return (
    <div className="space-y-6">
      {/* Top Banner: Today Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
              Today View
            </span>
            <span className="text-xs text-slate-400 font-mono">
              2-Hour Nowcast + 24-Hour Periods
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Tee-Time Selection for {course.shortName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pace of Play Estimated: {holeMode}-Hole Round (~{holeMode === 18 ? '4 hours' : '2 hours'}).
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Sunrise: {daylight.sunriseAt}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Sunset: {daylight.sunsetAt}</span>
          </div>
        </div>
      </div>

      {/* Recommended Tee-Time Windows Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recommended Tee-Time Windows
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Calculated from NEA periods & sun cycle
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedWindows.map((win, idx) => {
            const bandInfo = getBandDetails(win.band);
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition shadow-md relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                        {win.timeLabel}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {win.start} to {win.end} SGT
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-white">
                      {win.score}
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${bandInfo.badgeBg} ${bandInfo.badgeText}`}
                    >
                      {bandInfo.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 leading-relaxed mt-2">
                  <span className="text-emerald-400 font-semibold">Why this window: </span>
                  {win.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Hour Nowcast Immediate Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Immediate 2-Hour Nowcast ({next2h.area} Area)
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              Categorical Forecast
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {next2h.validFrom.slice(11, 16)} – {next2h.validTo.slice(11, 16)} SGT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="bg-slate-800/70 border border-slate-700/70 p-3 rounded-lg">
            <div className="text-xs text-slate-400 mb-0.5">NEA Area Forecast:</div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <span>{next2h.forecastLabel}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Thunderstorm Risk: <span className="text-amber-400 font-semibold">{next2h.thunderstormRisk}</span>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-3 rounded-lg">
            <div className="text-xs text-slate-400 mb-0.5">2-Hour Golfability:</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {next2h.score}
              <span className="text-xs text-slate-400"> / 100</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5">
              Verdict: <span className="uppercase font-bold text-white">{next2h.decision}</span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <button
              onClick={() =>
                onOpenPeriodDetail(
                  {
                    timeLabel: '2-Hour Nowcast (' + next2h.area + ')',
                    forecastLabel: next2h.forecastLabel,
                    golfability: { score: next2h.score, band: next2h.score >= 75 ? 'good' : 'fair', drivers: next2h.drivers },
                    temperatureRangeC: [weather.now.temperatureC || 30, (weather.now.temperatureC || 30) + 2],
                    humidityRangePct: [weather.now.humidityPct || 70, (weather.now.humidityPct || 70) + 5],
                    windSpeedRangeKmh: [weather.now.wind.speedKmh || 10, (weather.now.wind.speedKmh || 10) + 5],
                  },
                  '2-Hour Nowcast Details'
                )
              }
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Audit 2-Hour Factors</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 24-Hour Periods Strip (NEA Official Periods) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Official 24-Hour Periods ({course.region.toUpperCase()} Region)
            </h3>
            <p className="text-xs text-slate-400">
              NEA publishes discrete multi-hour period blocks, not true hourly steps.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {next24h.map((period, idx) => {
            const bandInfo = getBandDetails(period.golfability.band);
            return (
              <div
                key={idx}
                onClick={() => onOpenPeriodDetail(period, `Period Breakdown: ${period.timeLabel}`)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition group shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Period Time & Forecast */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          {period.timeLabel}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {period.forecastLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                          {period.temperatureRangeC[0]}°C – {period.temperatureRangeC[1]}°C
                        </span>
                        <span className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-teal-400" />
                          {period.windSpeedRangeKmh[0]}–{period.windSpeedRangeKmh[1]} km/h
                        </span>
                        <span>RH: {period.humidityRangePct[0]}%–{period.humidityRangePct[1]}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Trigger */}
                  <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-white">
                        {period.golfability.score}
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${bandInfo.badgeBg} ${bandInfo.badgeText}`}
                      >
                        {bandInfo.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 group-hover:text-emerald-400 font-semibold flex items-center gap-1 transition shrink-0">
                      <span className="hidden sm:inline">Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </div>

                {/* Score Drivers preview */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span className="font-medium text-slate-300">Key drivers:</span>
                  {period.golfability.drivers.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60 text-[11px]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
