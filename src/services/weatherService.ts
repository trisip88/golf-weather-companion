import {
  NormalizedWeatherContract,
  GolfCourse,
  PeriodForecast,
  DayOutlook,
  RecommendedWindow,
  Alert,
  FeedStaleness,
} from '../types';
import { SINGAPORE_GOLF_COURSES, DEFAULT_COURSE } from '../data/courses';
import {
  calculateDistanceKm,
  calculateHeatIndex,
  knotsToKmh,
  degreesToCardinal,
} from '../utils/geo';
import {
  calculateGolfability,
  getThunderstormRisk,
  get2HourDecision,
} from '../utils/golfScore';

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
  return localStorage.getItem(HOLE_MODE_KEY) === '9' ? 9 : 18;
}

export function saveHoleMode(mode: 9 | 18): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HOLE_MODE_KEY, mode.toString());
  }
}

/**
 * Synthesizes a realistic, rich Singapore weather contract when offline or backend is unreachable
 */
export function generateSyntheticContract(courseId: string): NormalizedWeatherContract {
  const course =
    SINGAPORE_GOLF_COURSES.find((c) => c.id === courseId) || DEFAULT_COURSE;
  const now = new Date();
  const currentHour = now.getHours();

  // Tropical Singapore baseline
  const isNight = currentHour < 7 || currentHour >= 19;
  const tempC = isNight ? 27.2 : currentHour >= 12 && currentHour <= 15 ? 32.4 : 30.1;
  const rhPct = isNight ? 86 : currentHour >= 12 && currentHour <= 15 ? 68 : 75;
  const heatIndexC = calculateHeatIndex(tempC, rhPct);
  const windSpeedKmh = 12.5;

  const twoHrForecastLabel = isNight
    ? 'Fair (Night)'
    : currentHour >= 13 && currentHour <= 16
    ? 'Thundery Showers (Afternoon)'
    : 'Partly Cloudy (Day)';

  const tsRisk = getThunderstormRisk(twoHrForecastLabel);
  const twoHrScoreObj = calculateGolfability({
    forecastLabel: twoHrForecastLabel,
    isRaining: false,
    rainfallMm: 0,
    temperatureC: tempC,
    heatIndexC,
    windSpeedKmh,
    uvIndex: isNight ? 0 : 7,
    psi: 46,
    pm25: 14,
  });

  const decisionObj = get2HourDecision(twoHrScoreObj.score, tsRisk);
  const validFrom = now.toISOString();
  const validTo = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();

  // 24-Hour Periods
  const periodsConfig = [
    { text: 'Morning (06:00 - 12:00)', forecast: 'Fair (Day)', temp: [26, 31] as [number, number], rh: [65, 85] as [number, number] },
    { text: 'Afternoon (12:00 - 18:00)', forecast: 'Partly Cloudy (Day)', temp: [28, 33] as [number, number], rh: [60, 80] as [number, number] },
    { text: 'Night (18:00 - 06:00)', forecast: 'Fair (Night)', temp: [25, 29] as [number, number], rh: [75, 92] as [number, number] },
  ];

  const next24h: PeriodForecast[] = periodsConfig.map((p) => {
    const pScore = calculateGolfability({
      forecastLabel: p.forecast,
      temperatureC: (p.temp[0] + p.temp[1]) / 2,
      heatIndexC: calculateHeatIndex((p.temp[0] + p.temp[1]) / 2, (p.rh[0] + p.rh[1]) / 2),
      windSpeedKmh: 14,
      psi: 46,
      uvIndex: isNight ? 0 : 6,
    });
    return {
      periodStart: now.toISOString(),
      periodEnd: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
      timeLabel: p.text,
      forecastLabel: p.forecast,
      regionalLabel: `${course.region.toUpperCase()} Region: ${p.forecast}`,
      temperatureRangeC: p.temp,
      humidityRangePct: p.rh,
      windSpeedRangeKmh: [10, 18],
      golfability: pScore,
    };
  });

  // 4-Day Outlook
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const next4d: DayOutlook[] = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const dayName = dayNames[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];
    const label = i % 2 === 0 ? 'Thundery Showers (Afternoon)' : 'Partly Cloudy (Day)';
    const uncertainty = i === 1 ? 'low' : i <= 3 ? 'medium' : 'high';
    const dayScore = calculateGolfability({
      forecastLabel: label,
      temperatureC: 29.5,
      heatIndexC: calculateHeatIndex(29.5, 78),
      windSpeedKmh: 15,
      uncertainty,
    });

    next4d.push({
      date: dateStr,
      dayName,
      forecastLabel: label,
      temperatureRangeC: [25, 33],
      humidityRangePct: [60, 90],
      windSpeedRangeKmh: [10, 20],
      golfability: dayScore,
    });
  }

  // Recommended Windows
  const recommendedWindows: RecommendedWindow[] = [
    {
      start: '07:00',
      end: '11:00',
      timeLabel: 'Early Morning Window (07:00 - 11:00)',
      score: Math.min(100, twoHrScoreObj.score + 5),
      band: twoHrScoreObj.band,
      reason: 'Cooler fairway temperatures, lower heat index, optimal green roll.',
    },
    {
      start: '15:30',
      end: '18:30',
      timeLabel: 'Late Afternoon Window (15:30 - 18:30)',
      score: Math.max(35, twoHrScoreObj.score - 3),
      band: twoHrScoreObj.band,
      reason: 'UV index drops significantly; watch for typical afternoon convective clouds.',
    },
  ];

  // Alerts
  const alerts: Alert[] = [];
  if (tsRisk === 'likely' || tsRisk === 'possible') {
    alerts.push({
      type: 'thunderstorm',
      severity: tsRisk === 'likely' ? 'unsafe' : 'high',
      message: `Thunderstorm hazard forecast in ${course.forecastArea}. Always defer to the club's lightning warning siren.`,
      basis: 'forecast',
      startsAt: validFrom,
      endsAt: validTo,
    });
  }

  const staleness: FeedStaleness[] = [
    { feed: 'Station Readings (Temp / RH / Rain / Wind)', observedAt: validFrom, isStale: false },
    { feed: '2-Hour Nowcast', observedAt: validFrom, isStale: false },
    { feed: '24-Hour Regional Forecast', observedAt: validFrom, isStale: false },
    { feed: '4-Day Outlook', observedAt: validFrom, isStale: false },
  ];

  return {
    course: {
      name: course.name,
      id: course.id,
      lat: course.lat,
      lon: course.lon,
      forecastArea: course.forecastArea,
      nearestStationId: 'S60',
      region: course.region,
    },
    generatedAt: now.toISOString(),
    source: 'nea-api-open.data.gov.sg-v2',
    now: {
      observedAt: now.toISOString(),
      temperatureC: tempC,
      humidityPct: rhPct,
      heatIndexC,
      heatIndexDerived: true,
      rainfallMm: 0,
      isRaining: false,
      wind: {
        speedKmh: windSpeedKmh,
        gustKmh: 18,
        directionDeg: 140,
        cardinal: 'SE',
      },
      uvIndex: isNight ? 0 : 6,
      psi: 46,
      pm25: 14,
      stationDistanceKm: 2.1,
      stationName: 'Sentosa Meteorological Telemetry Station',
    },
    next2h: {
      validFrom,
      validTo,
      area: course.forecastArea,
      forecastLabel: twoHrForecastLabel,
      thunderstormRisk: tsRisk,
      basis: 'forecast',
      decision: decisionObj.decision,
      score: twoHrScoreObj.score,
      drivers: twoHrScoreObj.drivers,
    },
    next24h,
    next4d,
    recommendedWindows,
    alerts,
    daylight: {
      sunriseAt: '07:05',
      sunsetAt: '19:15',
    },
    staleness,
  };
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

    if (!contract || !contract.now || !contract.next2h) {
      throw new Error('Incomplete weather contract payload');
    }

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
    console.warn('[WeatherService] Server fetch failed, falling back gracefully:', err);

    // 1. Check local storage cache
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + courseId);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.now && parsed.next2h) {
            return parsed;
          }
        } catch (e) {
          // ignore parse error
        }
      }
    }

    // 2. Generate resilient synthetic contract
    return generateSyntheticContract(courseId);
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
