import React, { useState, useEffect } from 'react';
import {
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  Info,
  Clock,
  Compass,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import { GolfCourse } from '../types';

interface HeaderProps {
  currentCourse: GolfCourse;
  onOpenCourseSelector: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: string | null;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenMiro: () => void;
  holeMode: 9 | 18;
  onToggleHoleMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCourse,
  onOpenCourseSelector,
  onRefresh,
  isLoading,
  lastUpdated,
  highContrast,
  onToggleHighContrast,
  onOpenMiro,
  holeMode,
  onToggleHoleMode,
}) => {
  const [sgTime, setSgTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Singapore Time (UTC+8)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setSgTime(new Intl.DateTimeFormat('en-SG', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md">
      {/* Top micro bar: SGT Time & Course Location */}
      <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-medium">
            <Clock className="w-3 h-3" />
            {sgTime || 'SGT'} (UTC+8)
          </span>
          <span className="text-slate-600">•</span>
          <span className="truncate hidden sm:inline text-slate-400">
            {currentCourse.forecastArea} Area • {currentCourse.region.toUpperCase()} Region
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleHoleMode}
            id="btn-toggle-hole-mode"
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Toggle between 9-hole (~2h) and 18-hole (~4h) round estimation"
          >
            {holeMode}-Hole Round (~{holeMode === 18 ? '4h' : '2h'})
          </button>

          <button
            onClick={onToggleHighContrast}
            id="btn-high-contrast"
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition ${
              highContrast
                ? 'bg-amber-400 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle High-Contrast Direct Sunlight Mode"
          >
            <Sun className="w-3 h-3" />
            {highContrast ? 'Sunlight Mode ON' : 'Sunlight Mode'}
          </button>

          <button
            onClick={onOpenMiro}
            id="btn-open-miro-specs"
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
            title="View Product Specs & Miro Architecture Map"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Product Specs</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar: Course Selection & Refresh */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={onOpenCourseSelector}
          id="btn-select-course"
          className="flex items-center gap-2.5 text-left group hover:bg-slate-800/80 p-1.5 -ml-1.5 rounded-lg transition"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight group-hover:text-emerald-400 transition">
                {currentCourse.shortName}
              </h1>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Tap to switch course ({currentCourse.holes} holes)</span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            id="btn-refresh-weather"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 disabled:opacity-50 shadow-sm`}
            title="Refresh live feeds from NEA data.gov.sg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Feeds</span>
          </button>
        </div>
      </div>
    </header>
  );
};
