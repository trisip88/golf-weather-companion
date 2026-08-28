import React from 'react';
import {
  Calendar,
  AlertCircle,
  Thermometer,
  Wind,
  CloudRain,
  ArrowRight,
  Info,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { DayOutlook, NormalizedWeatherContract } from '../types';
import { getBandDetails } from '../utils/golfScore';

interface OutlookViewProps {
  weather: NormalizedWeatherContract;
  onOpenPeriodDetail: (period: any, title: string) => void;
}

export const OutlookView: React.FC<OutlookViewProps> = ({
  weather,
  onOpenPeriodDetail,
}) => {
  const { next4d, course } = weather;

  const getUncertaintyBadge = (uncertainty?: 'low' | 'medium' | 'high') => {
    switch (uncertainty) {
      case 'low':
        return {
          label: 'Low Uncertainty (High Confidence)',
          bg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        };
      case 'medium':
        return {
          label: 'Medium Uncertainty (Planning Grade)',
          bg: 'bg-amber-950 text-amber-300 border-amber-800',
        };
      case 'high':
      default:
        return {
          label: 'High Uncertainty (Subject to Shift)',
          bg: 'bg-rose-950 text-rose-300 border-rose-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Uncertainty Guardrail Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-800">
            4-Day Outlook
          </span>
          <span className="text-xs text-slate-400 font-mono">
            NEA MSS Meteorological Outlook
          </span>
        </div>
        <h2 className="text-lg font-bold text-white">
          4-Day Planning Forecast for {course.shortName}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Planning-grade horizon for upcoming tee times. In Singapore's tropical climate, convective afternoon thunderstorms can form rapidly; always re-check conditions 2–4 hours before tee-off.
        </p>
      </div>

      {/* 4-Day Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {next4d.map((day, idx) => {
          const bandInfo = getBandDetails(day.golfability.band);
          const uncert = getUncertaintyBadge(day.golfability.uncertainty);

          return (
            <div
              key={idx}
              onClick={() =>
                onOpenPeriodDetail(
                  {
                    timeLabel: `${day.dayName} (${day.date})`,
                    forecastLabel: day.forecastLabel,
                    golfability: day.golfability,
                    temperatureRangeC: day.temperatureRangeC,
                    humidityRangePct: day.humidityRangePct,
                    windSpeedRangeKmh: day.windSpeedRangeKmh,
                  },
                  `4-Day Outlook: ${day.dayName}`
                )
              }
              className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 sm:p-5 cursor-pointer transition group shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Top bar: Day Name + Date + Uncertainty */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition">
                        {day.dayName}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        {day.date}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${uncert.bg}`}
                      >
                        {uncert.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-white">
                      {day.golfability.score}
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${bandInfo.badgeBg} ${bandInfo.badgeText}`}
                    >
                      {bandInfo.label}
                    </span>
                  </div>
                </div>

                {/* Weather Forecast Badge */}
                <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg mb-3">
                  <div className="text-xs font-semibold text-white flex items-center gap-2 mb-1">
                    <CloudRain className="w-4 h-4 text-sky-400" />
                    <span>{day.forecastLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                      <span>{day.temperatureRangeC[0]}°C – {day.temperatureRangeC[1]}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      <span>{day.windSpeedRangeKmh[0]}–{day.windSpeedRangeKmh[1]} km/h</span>
                    </div>
                  </div>
                </div>

                {/* Drivers Preview */}
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Key Drivers:
                  </span>
                  {day.golfability.drivers.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-400">
                <span>View Full Day Breakdown</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Singapore Tropical Planning Guideline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Pro Tip for SG Golfers:</strong> Typical convective patterns bring brief, heavy afternoon showers (between 13:00 and 16:30). Booking early morning slots (07:00–08:30) generally offers the highest probability of completing 18 holes uninterrupted.
        </p>
      </div>
    </div>
  );
};
