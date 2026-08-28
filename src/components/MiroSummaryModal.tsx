import React, { useState } from 'react';
import { X, Layers, CheckCircle2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface MiroSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MiroSummaryModal: React.FC<MiroSummaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'problem',
      title: '1. Problem Statement',
      stickies: [
        'Singapore tropical weather changes rapidly; rain and thunderstorms make or break a round.',
        'Standard weather apps report daily % chances that fail to guide tee-time decisions.',
        'Golfers need instant, actionable 0–100 verdicts on their phone in direct sunlight.',
      ],
      color: 'bg-amber-900/40 border-amber-600/50 text-amber-200',
    },
    {
      id: 'personas',
      title: '2. Personas',
      stickies: [
        'Recreational Weekend Golfer: Books 4 days ahead, checks night before.',
        'Early Bird Member: Needs quick 06:30 AM nowcast before driving to the first tee.',
        'Casual 9-Hole Twilight Player: Monitors late afternoon storm buildup.',
      ],
      color: 'bg-blue-900/40 border-blue-600/50 text-blue-200',
    },
    {
      id: 'jtbd',
      title: '3. Jobs to Be Done',
      stickies: [
        'When deciding to tee off now: Tell me if it is safe to play or if I should wait/abandon.',
        'When booking tomorrow: Give me the best 24-hour tee-time window.',
        'When planning the weekend: Show 4-day outlook with honest uncertainty.',
      ],
      color: 'bg-emerald-900/40 border-emerald-600/50 text-emerald-200',
    },
    {
      id: 'journey',
      title: '4. User Journey',
      stickies: [
        'Horizon 4 Days: Macro planning — is the weekend worth reserving?',
        'Horizon 24 Hours: Tee-time selection — pick morning vs afternoon window.',
        'Horizon 2 Hours: Play, delay, or abandon decision based on categorical nowcast.',
        'Horizon Live: Immediate station telemetry (rain gauge, wind, temp, UV).',
      ],
      color: 'bg-indigo-900/40 border-indigo-600/50 text-indigo-200',
    },
    {
      id: 'weather',
      title: '5. Weather Data Feeds (10 NEA MSS APIs)',
      stickies: [
        '2-Hour Nowcast: Categorical label for 47 Singapore areas.',
        '24-Hour Forecast: Period blocks with regional breakdown (N/S/E/W/Central).',
        '4-Day Outlook: Daily temp/humidity/wind ranges.',
        'Station Readings: Air temp, relative humidity, rain gauge (mm), wind speed (knots).',
        'Atmospheric Quality: UV solar index, PSI 24h, PM2.5 1h.',
      ],
      color: 'bg-purple-900/40 border-purple-600/50 text-purple-200',
    },
    {
      id: 'algorithm',
      title: '6. Golfability Algorithm (0–100)',
      stickies: [
        'Rain & Thunderstorm is the absolute deal breaker (crushes score to <40 / Avoid).',
        'Derived Heat Index (Steadman formula): Penalizes score when >38°C (Stay hydrated).',
        'Wind Speed: Advises 1–3 club adjustments when >25 km/h.',
        'Air Quality (PSI >100) & UV (>9): Trigger protective health drivers.',
        'Always transparent: Top 2–3 drivers published alongside every score.',
      ],
      color: 'bg-rose-900/40 border-rose-600/50 text-rose-200',
    },
    {
      id: 'features',
      title: '7. Features & Safety Architecture',
      stickies: [
        'Home/Now instant decision screen with large optical score gauge.',
        'Today View: Merged 2h nowcast + 24h periods tee-time window picker.',
        'Outlook View: 4-day planning with visible confidence badges.',
        'Live Conditions: Pure observed station sensors with distance in km.',
        'Safety Banner: Advisory only — always defer to course lightning siren.',
        'High-Contrast Sunlight Mode for fairway legibility.',
      ],
      color: 'bg-teal-900/40 border-teal-600/50 text-teal-200',
    },
    {
      id: 'architecture',
      title: '8. Screen Concepts & Flow',
      stickies: [
        'Home / Now → Choose View (Today / Week Outlook / Live Station).',
        'Today View → Recommended Windows & Period Breakdown.',
        'Week View → Select Day → Detailed Breakdown.',
        'Live Conditions → Pure sensor telemetry with station distance.',
      ],
      color: 'bg-slate-800/80 border-slate-600/50 text-slate-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Product Specification & Miro Board Mapping
              </h3>
              <p className="text-xs text-slate-400">
                RGOGC Golf Weather SG Kickoff & Architecture Reference
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Miro Sticky Board */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className={`p-4 rounded-xl border ${sec.color} shadow-md`}
              >
                <h4 className="text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {sec.title}
                </h4>
                <ul className="space-y-1.5">
                  {sec.stickies.map((sticky, idx) => (
                    <li
                      key={idx}
                      className="text-xs bg-black/30 p-2 rounded-lg border border-white/10 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-emerald-400 font-bold shrink-0">📌</span>
                      <span>{sticky}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Data Sources: NEA / Meteorological Service Singapore via data.gov.sg v2</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
