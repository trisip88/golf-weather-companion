import { NormalizedWeatherContract, GolfCourse } from '../types';
import { SINGAPORE_GOLF_COURSES, DEFAULT_COURSE } from '../data/courses';
import { calculateDistanceKm } from '../utils/geo';

const CACHE_KEY_PREFIX = 'golf_weather_sg_';
const FAV_COURSE_KEY = 'golf_weather_fav_course';
const HIGH_CONTRAST_KEY = 'golf_weather_high_contrast';
const HOLE_MODE_KEY = 'golf_weather_hole_mode';

export function getSavedCourseId(): string {
  if (typeof window === 'undefined') return DEFAULT_COURSE.id;
  return localStorage.getItem(FAV_COURSE_KEY) || DEFAULT_COURSE.id;
}

export function saveCourseId(courseId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FAV_COURSE_KEY, courseId);
  }
}

export function getSavedHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true';
}

export function saveHighContrast(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HIGH_CONTRAST_KEY, enabled ? 'true' : 'false');
  }
}

export function getSavedHoleMode(): 9 | 18 {
  if (typeof window === 'undefined') return 18;
  return (localStorage.getItem(HOLE_MODE_KEY) === '9' ? 9 : 18);
}

export function saveHoleMode(mode: 9 | 18): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HOLE_MODE_KEY, mode.toString());
  }
}

export async function fetchWeatherForCourse(
  courseId: string,
  forceRefresh = false
): Promise<NormalizedWeatherContract> {
  const url = forceRefresh ? '/api/refresh' : `/api/weather?course=${encodeURIComponent(courseId)}`;
  
  try {
    const res = await (forceRefresh
      ? fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course: courseId }),
        })
      : fetch(url));

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    const contract: NormalizedWeatherContract = forceRefresh ? data.contract : data;

    // Cache locally
    if (typeof window !== 'undefined' && contract) {
      try {
        localStorage.setItem(CACHE_KEY_PREFIX + courseId, JSON.stringify(contract));
      } catch (e) {
        // ignore quota
      }
    }

    return contract;
  } catch (err) {
    console.warn('[WeatherService] Fetch from server failed, attempting local cache fallback:', err);
    
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + courseId);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          // ignore
        }
      }
    }
    throw err;
  }
}

export function findNearestCourse(userLat: number, userLon: number): {
  course: GolfCourse;
  distanceKm: number;
} {
  let nearest = SINGAPORE_GOLF_COURSES[0];
  let minDistance = Infinity;

  for (const c of SINGAPORE_GOLF_COURSES) {
    const d = calculateDistanceKm(userLat, userLon, c.lat, c.lon);
    if (d < minDistance) {
      minDistance = d;
      nearest = c;
    }
  }

  return {
    course: nearest,
    distanceKm: minDistance,
  };
}
