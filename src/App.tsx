import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  Calendar,
  Activity,
  AlertTriangle,
  RefreshCw,
  Sun,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { HomeNowView } from './components/HomeNowView';
import { TodayView } from './components/TodayView';
import { OutlookView } from './components/OutlookView';
import { LiveConditionsView } from './components/LiveConditionsView';
import { PeriodDetailModal } from './components/PeriodDetailModal';
import { CourseSelectorModal } from './components/CourseSelectorModal';
import { MiroSummaryModal } from './components/MiroSummaryModal';

import { NormalizedWeatherContract, GolfCourse } from './types';
import { SINGAPORE_GOLF_COURSES, DEFAULT_COURSE } from './data/courses';
import {
  fetchWeatherForCourse,
  getSavedCourseId,
  saveCourseId,
  getSavedHighContrast,
  saveHighContrast,
  getSavedHoleMode,
  saveHoleMode,
} from './services/weatherService';

export default function App() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(getSavedCourseId());
  const [weatherData, setWeatherData] = useState<NormalizedWeatherContract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // View navigation: 'now' | 'today' | 'outlook' | 'live'
  const [activeTab, setActiveTab] = useState<'now' | 'today' | 'outlook' | 'live'>('now');

  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);
  const [isMiroModalOpen, setIsMiroModalOpen] = useState<boolean>(false);
  const [selectedPeriodForModal, setSelectedPeriodForModal] = useState<{
    data: any;
    title: string;
  } | null>(null);

  // User preferences
  const [highContrast, setHighContrast] = useState<boolean>(getSavedHighContrast());
  const [holeMode, setHoleMode] = useState<9 | 18>(getSavedHoleMode());

  const currentCourse: GolfCourse =
    SINGAPORE_GOLF_COURSES.find((c) => c.id === selectedCourseId) || DEFAULT_COURSE;

  // Load weather data
  const loadWeather = async (courseId: string, force = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await fetchWeatherForCourse(courseId, force);
      setWeatherData(data);
      setLastUpdated(new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to load weather:', err);
      setErrorMessage('Could not connect to Singapore NEA weather services. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedCourseId, false);
    // Poll every 60 seconds
    const interval = setInterval(() => {
      loadWeather(selectedCourseId, false);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedCourseId]);

  const handleSelectCourse = (course: GolfCourse) => {
    setSelectedCourseId(course.id);
    saveCourseId(course.id);
  };

  const handleToggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    saveHighContrast(next);
  };

  const handleToggleHoleMode = () => {
    const next = holeMode === 18 ? 9 : 18;
    setHoleMode(next);
    saveHoleMode(next);
  };

  const handleOpenPeriodDetail = (data: any, title: string) => {
    setSelectedPeriodForModal({ data, title });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        highContrast
          ? 'bg-black text-white contrast-125'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* App Header */}
      <Header
        currentCourse={currentCourse}
        onOpenCourseSelector={() => setIsCourseModalOpen(true)}
        onRefresh={() => loadWeather(selectedCourseId, true)}
        isLoading={isLoading || isRefreshing}
        lastUpdated={lastUpdated}
        highContrast={highContrast}
        onToggleHighContrast={handleToggleHighContrast}
        onOpenMiro={() => setIsMiroModalOpen(true)}
        holeMode={holeMode}
        onToggleHoleMode={handleToggleHoleMode}
      />

      {/* Safety Alerts Banner (Pinned at top) */}
      {weatherData && weatherData.alerts && (
        <AlertBanner alerts={weatherData.alerts} />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* Navigation Tabs (Horizontal Scroll on Mobile) */}
        <nav
          id="main-view-tabs"
          className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-5 overflow-x-auto scrollbar-none"
        >
          <button
            onClick={() => setActiveTab('now')}
            id="tab-now"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'now'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Home / Now</span>
          </button>

          <button
            onClick={() => setActiveTab('today')}
            id="tab-today"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'today'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Tee Times</span>
          </button>

          <button
            onClick={() => setActiveTab('outlook')}
            id="tab-outlook"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'outlook'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>4-Day Outlook</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            id="tab-live"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Station Data</span>
          </button>
        </nav>

        {/* Loading Spinner */}
        {isLoading && !weatherData && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Gathering real-time NEA Singapore meteorological feeds...
            </p>
            <p className="text-xs text-slate-500">
              Station readings • 2-Hour Nowcast • 24-Hour Periods • 4-Day Outlook
            </p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !weatherData && (
          <div className="p-6 bg-rose-950/60 border border-rose-800 rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Weather Data Feed Error</h3>
            <p className="text-xs text-rose-200 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={() => loadWeather(selectedCourseId, true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Content Views */}
        {weatherData && (
          <div>
            {activeTab === 'now' && (
              <HomeNowView
                weather={weatherData}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenPeriodDetail={handleOpenPeriodDetail}
                holeMode={holeMode}
              />
            )}

            {activeTab === 'today' && (
              <TodayView
                weather={weatherData}
                onOpenPeriodDetail={handleOpenPeriodDetail}
                holeMode={holeMode}
              />
            )}

            {activeTab === 'outlook' && (
              <OutlookView
                weather={weatherData}
                onOpenPeriodDetail={handleOpenPeriodDetail}
              />
            )}

            {activeTab === 'live' && (
              <LiveConditionsView weather={weatherData} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 text-slate-500 text-xs text-center">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Data provided by <strong>NEA & Meteorological Service Singapore</strong> via data.gov.sg v2 APIs.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMiroModalOpen(true)}
              className="hover:text-emerald-400 transition underline underline-offset-2"
            >
              Miro Board Specs
            </button>
            <span>•</span>
            <span>Advisory Only • Defer to Course Horn</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CourseSelectorModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        selectedCourseId={selectedCourseId}
        onSelectCourse={handleSelectCourse}
      />

      <PeriodDetailModal
        isOpen={selectedPeriodForModal !== null}
        onClose={() => setSelectedPeriodForModal(null)}
        title={selectedPeriodForModal?.title || 'Period Audit'}
        periodData={selectedPeriodForModal?.data || null}
      />

      <MiroSummaryModal
        isOpen={isMiroModalOpen}
        onClose={() => setIsMiroModalOpen(false)}
      />
    </div>
  );
}
