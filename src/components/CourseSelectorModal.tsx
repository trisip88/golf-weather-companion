import React, { useState } from 'react';
import {
  X,
  Search,
  MapPin,
  Compass,
  Navigation,
  Check,
  ChevronRight,
} from 'lucide-react';
import { GolfCourse } from '../types';
import { SINGAPORE_GOLF_COURSES } from '../data/courses';
import { findNearestCourse } from '../services/weatherService';

interface CourseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourseId: string;
  onSelectCourse: (course: GolfCourse) => void;
}

export const CourseSelectorModal: React.FC<CourseSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCourseId,
  onSelectCourse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCourses = SINGAPORE_GOLF_COURSES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.forecastArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Locating your position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const result = findNearestCourse(latitude, longitude);
        setLocationStatus(`Found ${result.course.shortName} (~${result.distanceKm} km away)`);
        setTimeout(() => {
          onSelectCourse(result.course);
          onClose();
        }, 600);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('Could not get GPS location. Please select from list.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        id="modal-select-course"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Singapore Golf Clubs
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Select Golf Course
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & GPS Action */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/90">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              id="input-search-course"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course name, region, or area..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
          </div>

          <button
            onClick={handleDetectGPS}
            disabled={isLocating}
            id="btn-gps-detect-course"
            className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting Nearest Course...' : 'Use GPS: Find Nearest Golf Course'}</span>
          </button>

          {locationStatus && (
            <div className="text-xs text-center text-emerald-400 font-medium animate-fade-in">
              {locationStatus}
            </div>
          )}
        </div>

        {/* Course List */}
        <div className="max-h-[55vh] overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/40">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No golf courses matching "{searchQuery}"
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isSelected = course.id === selectedCourseId;
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    onSelectCourse(course);
                    onClose();
                  }}
                  id={`course-item-${course.id}`}
                  className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-950/60 border border-emerald-600/50 text-white'
                      : 'hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {course.shortName}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {course.region}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Area: {course.forecastArea} • {course.holes} Holes
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
