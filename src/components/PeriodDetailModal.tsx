import React from 'react';
import {
  X,
  Sparkles,
  Thermometer,
  Wind,
  CloudRain,
  Sun,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Compass,
} from 'lucide-react';
import { getBandDetails } from '../utils/golfScore';

interface PeriodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  periodData: {
    timeLabel?: string;
    forecastLabel?: string;
    regionalLabel?: string;
    temperatureRangeC?: [number, number];
    humidityRangePct?: [number, number];
    windSpeedRangeKmh?: [number, number];
    golfability?: {
      score: number;
      band: any;
      drivers: string[];
      uncertainty?: string;
    };
  } | null;
}

export const PeriodDetailModal: React.FC<PeriodDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  periodData,
}) => {
  if (!isOpen || !periodData) return null;

  const {
    timeLabel,
    forecastLabel,
    temperatureRangeC,
    humidityRangePct,
    windSpeedRangeKmh,
    golfability,
  } = periodData;

  const score = golfability?.score ?? 85;
  const band = getBandDetails(golfability?.band || 'good');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        id="modal-period-breakdown"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Period Audit & Score Breakdown
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {timeLabel || title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Score & Band Header */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Calculated Golfability</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-4xl font-black font-mono text-white">{score}</span>
                <span className="text-sm text-slate-400 font-bold">/ 100</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${band.badgeBg} ${band.badgeText}`}
              >
                {band.label} — {band.action}
              </span>
              <div className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                {band.meaning}
              </div>
            </div>
          </div>

          {/* Meteorological Parameters */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Forecast Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-800/50 border border-slate-700/60 p-2.5 rounded-lg">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  <span>Weather</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {forecastLabel || 'Partly Cloudy'}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-2.5 rounded-lg">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Temperature Range</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {temperatureRangeC ? `${temperatureRangeC[0]}°C – ${temperatureRangeC[1]}°C` : '26°C – 33°C'}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-2.5 rounded-lg">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {windSpeedRangeKmh ? `${windSpeedRangeKmh[0]} – ${windSpeedRangeKmh[1]} km/h` : '10 – 20 km/h'}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-2.5 rounded-lg">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Relative Humidity</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {humidityRangePct ? `${humidityRangePct[0]}% – ${humidityRangePct[1]}%` : '60% – 90%'}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Score Drivers Audit */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Algorithm Driver Deductions
            </h4>
            <div className="space-y-2">
              {golfability?.drivers && golfability.drivers.length > 0 ? (
                golfability.drivers.map((driver, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900/80 p-2 rounded-lg border border-slate-800"
                  >
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{driver}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">
                  Standard tropical conditions; zero adverse deductions applied.
                </div>
              )}
            </div>
          </div>

          {/* Caddie Advice */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 text-xs text-emerald-200">
            <span className="font-bold block mb-1 text-emerald-300">Caddie's Recommendation:</span>
            {score >= 75 ? (
              <p>Great window to book. Green conditions should be fast and dry. Maintain hydration with electrolytes.</p>
            ) : score >= 60 ? (
              <p>Playable round. Bring an umbrella, rain gloves, and pack extra towels in case of sudden tropical passing drizzle.</p>
            ) : (
              <p>High likelihood of stoppage or siren horns. If teeing off, ensure you are near course storm shelters.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
