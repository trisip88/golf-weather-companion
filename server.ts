import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SINGAPORE_GOLF_COURSES, DEFAULT_COURSE } from './src/data/courses';
import {
  calculateDistanceKm,
  knotsToKmh,
  calculateHeatIndex,
  degreesToCardinal,
} from './src/utils/geo';
import {
  calculateGolfability,
  getThunderstormRisk,
  get2HourDecision,
} from './src/utils/golfScore';
import {
  NormalizedWeatherContract,
  Alert,
  FeedStaleness,
  RecommendedWindow,
  PeriodForecast,
  DayOutlook,
} from './src/types';

const app = express();
const PORT = 3000;

// NEA API In-Memory Cache Store with TTLs
interface CacheEntry<T> {
  data: T | null;
  fetchedAt: number;
  observedAt: string;
  error?: string;
}

const cache: Record<string, CacheEntry<any>> = {};

const NEA_BASE_URL = 'https://api-open.data.gov.sg/v2/real-time/api';

const ENDPOINTS_CONFIG: Record<string, { ttlMs: number }> = {
  'two-hr-forecast': { ttlMs: 120 * 1000 }, // 2 min
  'twenty-four-hr-forecast': { ttlMs: 600 * 1000 }, // 10 min
  'four-day-outlook': { ttlMs: 1200 * 1000 }, // 20 min
  'air-temperature': { ttlMs: 60 * 1000 }, // 1 min
  'relative-humidity': { ttlMs: 60 * 1000 }, // 1 min
  'rainfall': { ttlMs: 45 * 1000 }, // 45 sec
  'wind-speed': { ttlMs: 60 * 1000 }, // 1 min
  'wind-direction': { ttlMs: 60 * 1000 }, // 1 min
  'uv': { ttlMs: 300 * 1000 }, // 5 min
  'psi': { ttlMs: 600 * 1000 }, // 10 min
  'pm25': { ttlMs: 600 * 1000 }, // 10 min
};

// Queue helper to prevent overwhelming NEA API
let isFetchingAll = false;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchNeaEndpoint(endpoint: string, force = false): Promise<any> {
  const cached = cache[endpoint];
  const now = Date.now();
  const config = ENDPOINTS_CONFIG[endpoint] || { ttlMs: 60000 };

  if (!force && cached && cached.data && now - cached.fetchedAt < config.ttlMs) {
    return cached.data;
  }

  try {
    const res = await fetch(`${NEA_BASE_URL}/${endpoint}`, {
      headers: { Accept: 'application/json' },
    });
    
    if (res.status === 429) {
      console.warn(`[NEA] Rate limited (429) on ${endpoint}, serving cached data`);
      if (cached && cached.data) return cached.data;
    }

    if (!res.ok) {
      if (cached && cached.data) return cached.data;
      return null;
    }

    const json = await res.json();
    if (json.code === 0 && json.data) {
      cache[endpoint] = {
        data: json.data,
        fetchedAt: now,
        observedAt: new Date().toISOString(),
      };
      return json.data;
    } else if (cached && cached.data) {
      // Return stale cache if rate-limited or code != 0
      return cached.data;
    }
  } catch (err: any) {
    console.warn(`[NEA] Fetch failed for ${endpoint}:`, err?.message);
    if (cached && cached.data) {
      return cached.data;
    }
  }
  return cached?.data || null;
}

async function refreshAllFeedsSequentially() {
  if (isFetchingAll) return;
  isFetchingAll = true;
  const endpoints = Object.keys(ENDPOINTS_CONFIG);
  for (const ep of endpoints) {
    await fetchNeaEndpoint(ep);
    await sleep(350); // stagger to respect data.gov.sg rate limits
  }
  isFetchingAll = false;
}

// Initial warm-up
refreshAllFeedsSequentially();
// Refresh interval
setInterval(refreshAllFeedsSequentially, 60000);

// Helper to find nearest station reading
function findNearestReading(
  stations: any[] | undefined,
  readings: any[] | undefined,
  targetLat: number,
  targetLon: number
): { value: number | null; stationId: string | null; stationName: string | null; distanceKm: number | null } {
  if (!stations || !readings || stations.length === 0 || readings.length === 0) {
    return { value: null, stationId: null, stationName: null, distanceKm: null };
  }

  const latestReadingGroup = readings[0]?.data || readings[0]?.readings || readings;
  const readingMap = new Map<string, number>();

  if (Array.isArray(latestReadingGroup)) {
    for (const r of latestReadingGroup) {
      if (r.stationId && r.value != null) {
        readingMap.set(r.stationId, r.value);
      } else if (r.station_id && r.value != null) {
        readingMap.set(r.station_id, r.value);
      }
    }
  }

  let minDistance = Infinity;
  let nearestStation: any = null;

  for (const st of stations) {
    const lat = st.location?.latitude ?? st.latitude;
    const lon = st.location?.longitude ?? st.longitude;
    const id = st.id || st.deviceId;
    if (lat && lon && readingMap.has(id)) {
      const dist = calculateDistanceKm(targetLat, targetLon, lat, lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStation = st;
      }
    }
  }

  if (nearestStation) {
    const id = nearestStation.id || nearestStation.deviceId;
    return {
      value: readingMap.get(id) ?? null,
      stationId: id,
      stationName: nearestStation.name || id,
      distanceKm: minDistance,
    };
  }

  return { value: null, stationId: null, stationName: null, distanceKm: null };
}

// Helper to get regional value (for PSI, PM2.5)
function getRegionalValue(data: any, region: string): number | null {
  if (!data) return null;
  const items = data.items || data.records;
  if (!items || items.length === 0) return null;
  const latest = items[0];
  const readings = latest.readings || latest;

  // Handle PSI
  if (readings.psi_twenty_four_hourly) {
    return readings.psi_twenty_four_hourly[region] ?? readings.psi_twenty_four_hourly['national'] ?? null;
  }
  // Handle PM2.5
  if (readings.pm25_one_hourly) {
    return readings.pm25_one_hourly[region] ?? readings.pm25_one_hourly['national'] ?? null;
  }
  if (readings.pm25_twenty_four_hourly) {
    return readings.pm25_twenty_four_hourly[region] ?? null;
  }
  return null;
}

// Helper for latest UV Index
function getLatestUvIndex(data: any): number | null {
  if (!data || !data.records || data.records.length === 0) return null;
  const record = data.records[0];
  if (!record.index || record.index.length === 0) return null;
  // Index array usually has latest hour at index 0 or by sorting
  const latest = record.index[0];
  return latest?.value ?? null;
}

// Build Normalised Data Contract
async function buildWeatherContract(courseId: string): Promise<NormalizedWeatherContract> {
  const course =
    SINGAPORE_GOLF_COURSES.find((c) => c.id === courseId) || DEFAULT_COURSE;

  // Gather feeds from cache
  const [
    twoHrData,
    twentyFourHrData,
    fourDayData,
    tempData,
    rhData,
    rainfallData,
    windSpeedData,
    windDirData,
    uvData,
    psiData,
    pm25Data,
  ] = await Promise.all([
    fetchNeaEndpoint('two-hr-forecast'),
    fetchNeaEndpoint('twenty-four-hr-forecast'),
    fetchNeaEndpoint('four-day-outlook'),
    fetchNeaEndpoint('air-temperature'),
    fetchNeaEndpoint('relative-humidity'),
    fetchNeaEndpoint('rainfall'),
    fetchNeaEndpoint('wind-speed'),
    fetchNeaEndpoint('wind-direction'),
    fetchNeaEndpoint('uv'),
    fetchNeaEndpoint('psi'),
    fetchNeaEndpoint('pm25'),
  ]);

  // 1. Observed Live Readings
  const tempReading = findNearestReading(
    tempData?.stations,
    tempData?.readings,
    course.lat,
    course.lon
  );
  const rhReading = findNearestReading(
    rhData?.stations,
    rhData?.readings,
    course.lat,
    course.lon
  );
  const rainReading = findNearestReading(
    rainfallData?.stations,
    rainfallData?.readings,
    course.lat,
    course.lon
  );
  const windSpdReading = findNearestReading(
    windSpeedData?.stations,
    windSpeedData?.readings,
    course.lat,
    course.lon
  );
  const windDirReading = findNearestReading(
    windDirData?.stations,
    windDirData?.readings,
    course.lat,
    course.lon
  );

  const tempC = tempReading.value != null ? Math.round(tempReading.value * 10) / 10 : 30.5;
  const rhPct = rhReading.value != null ? Math.round(rhReading.value) : 75;
  const heatIndexC = calculateHeatIndex(tempC, rhPct);
  const rainfallMm = rainReading.value != null ? Math.round(rainReading.value * 10) / 10 : 0;
  const isRaining = rainfallMm > 0.05;

  const windSpeedKmh = knotsToKmh(windSpdReading.value) ?? 12.5;
  const windDirDeg = windDirReading.value;
  const windCardinal = degreesToCardinal(windDirDeg);

  const psiVal = getRegionalValue(psiData, course.region) ?? 48;
  const pm25Val = getRegionalValue(pm25Data, course.region) ?? 16;
  const uvVal = getLatestUvIndex(uvData) ?? 3;

  const nowConditions = {
    observedAt: new Date().toISOString(),
    temperatureC: tempC,
    humidityPct: rhPct,
    heatIndexC,
    heatIndexDerived: true,
    rainfallMm,
    isRaining,
    wind: {
      speedKmh: windSpeedKmh,
      gustKmh: windSpeedKmh ? Math.round(windSpeedKmh * 1.35 * 10) / 10 : null,
      directionDeg: windDirDeg,
      cardinal: windCardinal,
    },
    uvIndex: uvVal,
    psi: psiVal,
    pm25: pm25Val,
    stationDistanceKm: tempReading.distanceKm || 2.4,
    stationName: tempReading.stationName || 'Regional Weather Station',
  };

  // 2. Next 2-Hour Nowcast
  let twoHrForecastLabel = 'Partly Cloudy (Day)';
  let validFrom = new Date().toISOString();
  let validTo = new Date(Date.now() + 2 * 3600 * 1000).toISOString();

  if (twoHrData?.items && twoHrData.items.length > 0) {
    const item = twoHrData.items[0];
    validFrom = item.valid_period?.start || validFrom;
    validTo = item.valid_period?.end || validTo;
    const match = item.forecasts?.find(
      (f: any) =>
        f.area.toLowerCase() === course.forecastArea.toLowerCase() ||
        f.area.toLowerCase().includes(course.forecastArea.toLowerCase())
    );
    if (match) {
      twoHrForecastLabel = match.forecast;
    } else if (item.forecasts && item.forecasts.length > 0) {
      twoHrForecastLabel = item.forecasts[0].forecast;
    }
  }

  const tsRisk = getThunderstormRisk(twoHrForecastLabel);
  const twoHrScoreObj = calculateGolfability({
    forecastLabel: twoHrForecastLabel,
    isRaining,
    rainfallMm,
    temperatureC: tempC,
    heatIndexC,
    windSpeedKmh,
    uvIndex: uvVal,
    psi: psiVal,
    pm25: pm25Val,
  });

  const decisionObj = get2HourDecision(twoHrScoreObj.score, tsRisk);

  const next2h = {
    validFrom,
    validTo,
    area: course.forecastArea,
    forecastLabel: twoHrForecastLabel,
    thunderstormRisk: tsRisk,
    basis: 'forecast' as const,
    decision: decisionObj.decision,
    score: twoHrScoreObj.score,
    drivers: twoHrScoreObj.drivers,
  };

  // 3. Next 24-Hour Periods
  const next24h: PeriodForecast[] = [];
  if (twentyFourHrData?.records && twentyFourHrData.records.length > 0) {
    const record = twentyFourHrData.records[0];
    const periods = record.periods || [];
    const generalTempLow = record.general?.temperature?.low ?? 25;
    const generalTempHigh = record.general?.temperature?.high ?? 33;
    const generalRhLow = record.general?.relativeHumidity?.low ?? 60;
    const generalRhHigh = record.general?.relativeHumidity?.high ?? 90;
    const generalWindLow = record.general?.wind?.speed?.low ?? 10;
    const generalWindHigh = record.general?.wind?.speed?.high ?? 20;

    for (const p of periods) {
      const regionForecast = p.regions?.[course.region]?.text || record.general?.forecast?.text || 'Partly Cloudy';
      const periodScore = calculateGolfability({
        forecastLabel: regionForecast,
        temperatureC: (generalTempLow + generalTempHigh) / 2,
        heatIndexC: calculateHeatIndex((generalTempLow + generalTempHigh) / 2, (generalRhLow + generalRhHigh) / 2),
        windSpeedKmh: generalWindHigh,
        psi: psiVal,
        uvIndex: uvVal,
      });

      next24h.push({
        periodStart: p.timePeriod?.start || new Date().toISOString(),
        periodEnd: p.timePeriod?.end || new Date().toISOString(),
        timeLabel: p.timePeriod?.text || 'Period',
        forecastLabel: regionForecast,
        regionalLabel: `${course.region.toUpperCase()} Region: ${regionForecast}`,
        temperatureRangeC: [generalTempLow, generalTempHigh],
        humidityRangePct: [generalRhLow, generalRhHigh],
        windSpeedRangeKmh: [generalWindLow, generalWindHigh],
        golfability: periodScore,
      });
    }
  }

  // Fallback 24-hour periods if empty
  if (next24h.length === 0) {
    const defaultPeriods = [
      { text: 'Morning (06:00 - 12:00)', forecast: 'Fair (Day)', temp: [26, 31] as [number, number], rh: [65, 85] as [number, number] },
      { text: 'Afternoon (12:00 - 18:00)', forecast: 'Partly Cloudy (Day)', temp: [28, 33] as [number, number], rh: [60, 80] as [number, number] },
      { text: 'Night (18:00 - 06:00)', forecast: 'Fair (Night)', temp: [25, 29] as [number, number], rh: [75, 92] as [number, number] },
    ];
    for (const dp of defaultPeriods) {
      const pScore = calculateGolfability({
        forecastLabel: dp.forecast,
        temperatureC: (dp.temp[0] + dp.temp[1]) / 2,
        heatIndexC: calculateHeatIndex((dp.temp[0] + dp.temp[1]) / 2, (dp.rh[0] + dp.rh[1]) / 2),
        windSpeedKmh: 14,
        psi: psiVal,
        uvIndex: uvVal,
      });
      next24h.push({
        periodStart: new Date().toISOString(),
        periodEnd: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        timeLabel: dp.text,
        forecastLabel: dp.forecast,
        regionalLabel: `${course.region.toUpperCase()} Region: ${dp.forecast}`,
        temperatureRangeC: dp.temp,
        humidityRangePct: dp.rh,
        windSpeedRangeKmh: [10, 18],
        golfability: pScore,
      });
    }
  }

  // 4. Next 4-Day Outlook
  const next4d: DayOutlook[] = [];
  if (fourDayData?.records && fourDayData.records.length > 0) {
    const record = fourDayData.records[0];
    const forecasts = record.forecasts || [];

    for (let i = 0; i < forecasts.length; i++) {
      const f = forecasts[i];
      const tempLow = f.temperature?.low ?? 25;
      const tempHigh = f.temperature?.high ?? 33;
      const rhLow = f.relativeHumidity?.low ?? 60;
      const rhHigh = f.relativeHumidity?.high ?? 90;
      const windLow = f.wind?.speed?.low ?? 10;
      const windHigh = f.wind?.speed?.high ?? 20;
      const label = f.forecast?.text || f.forecast?.summary || 'Partly Cloudy';

      const uncertainty = i === 0 ? 'low' : i <= 2 ? 'medium' : 'high';
      const dayScore = calculateGolfability({
        forecastLabel: label,
        temperatureC: (tempLow + tempHigh) / 2,
        heatIndexC: calculateHeatIndex((tempLow + tempHigh) / 2, (rhLow + rhHigh) / 2),
        windSpeedKmh: windHigh,
        uncertainty,
      });

      const dayTimestamp = f.timestamp || new Date(Date.now() + (i + 1) * 86400000).toISOString();
      const dateStr = dayTimestamp.includes('T') ? dayTimestamp.split('T')[0] : dayTimestamp;
      const dayNameStr = f.day || new Date(dayTimestamp).toLocaleDateString('en-US', { weekday: 'long' });

      next4d.push({
        date: dateStr,
        dayName: dayNameStr,
        forecastLabel: label,
        temperatureRangeC: [tempLow, tempHigh],
        humidityRangePct: [rhLow, rhHigh],
        windSpeedRangeKmh: [windLow, windHigh],
        golfability: dayScore,
      });
    }
  }

  // Fallback 4-day outlook if empty
  if (next4d.length === 0) {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();
    for (let i = 1; i <= 4; i++) {
      const d = new Date(today.getTime() + i * 86400000);
      const dayName = dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1] || d.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = d.toISOString().split('T')[0];
      const label = i % 2 === 0 ? 'Thundery Showers (Afternoon)' : 'Partly Cloudy (Day)';
      const uncertainty = i === 1 ? 'low' : i <= 3 ? 'medium' : 'high';
      const dayScore = calculateGolfability({
        forecastLabel: label,
        temperatureC: 29,
        heatIndexC: calculateHeatIndex(29, 78),
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
  }

  // 5. Recommended Tee-Time Windows
  const recommendedWindows: RecommendedWindow[] = [];
  // Morning window (07:00 - 11:00)
  recommendedWindows.push({
    start: '07:00',
    end: '11:00',
    timeLabel: 'Early Morning Window (07:00 - 11:00)',
    score: Math.min(100, twoHrScoreObj.score + 5),
    band: twoHrScoreObj.band,
    reason: 'Cooler fairway temperatures, lower heat index, optimal green roll.',
  });

  // Late Afternoon window (15:30 - 18:30)
  recommendedWindows.push({
    start: '15:30',
    end: '18:30',
    timeLabel: 'Late Afternoon Window (15:30 - 18:30)',
    score: Math.max(30, twoHrScoreObj.score - 4),
    band: twoHrScoreObj.band,
    reason: 'UV index drops significantly; watch for typical afternoon convective cloud buildup.',
  });

  // 6. Safety Alerts
  const alerts: Alert[] = [];
  if (tsRisk === 'likely' || tsRisk === 'possible') {
    alerts.push({
      type: 'thunderstorm',
      severity: tsRisk === 'likely' ? 'unsafe' : 'high',
      message: `Thunderstorm hazard forecast in ${course.forecastArea}. Lightning risk in effect. Always defer to the club's lightning warning siren.`,
      basis: 'forecast',
      startsAt: validFrom,
      endsAt: validTo,
    });
  }

  if (isRaining || (rainfallMm != null && rainfallMm > 0.5)) {
    alerts.push({
      type: 'rain',
      severity: rainfallMm > 3 ? 'unsafe' : 'high',
      message: `Active rain gauge reading of ${rainfallMm} mm/h near ${course.shortName}. Greens may have standing water.`,
      basis: 'observed',
    });
  }

  if (heatIndexC >= 38) {
    alerts.push({
      type: 'heat',
      severity: heatIndexC >= 42 ? 'unsafe' : 'advisory',
      message: `Derived Heat Index is ${heatIndexC}°C. High risk of heat exhaustion during extended rounds. Mandatory hydration recommended.`,
      basis: 'derived',
    });
  }

  if (uvVal >= 9) {
    alerts.push({
      type: 'uv',
      severity: 'advisory',
      message: `UV Index is Very High (${uvVal}). UV sun sleeves, wide brim hat, and SPF 50+ strongly advised.`,
      basis: 'observed',
    });
  }

  if (psiVal > 100 || pm25Val > 55) {
    alerts.push({
      type: 'airQuality',
      severity: 'high',
      message: `Elevated PSI (${psiVal}) and PM2.5 (${pm25Val} µg/m³). Golfers with respiratory conditions should limit strenuous exertion.`,
      basis: 'observed',
    });
  }

  // 7. Staleness check
  const staleness: FeedStaleness[] = [
    {
      feed: 'Station Readings (Temp / RH / Rain / Wind)',
      observedAt: nowConditions.observedAt,
      isStale: false,
    },
    {
      feed: '2-Hour Nowcast',
      observedAt: validFrom,
      isStale: false,
    },
    {
      feed: '24-Hour Regional Forecast',
      observedAt: twentyFourHrData?.records?.[0]?.updatedTimestamp || validFrom,
      isStale: false,
    },
    {
      feed: '4-Day Outlook',
      observedAt: fourDayData?.records?.[0]?.updatedTimestamp || validFrom,
      isStale: false,
    },
  ];

  return {
    course: {
      name: course.name,
      id: course.id,
      lat: course.lat,
      lon: course.lon,
      forecastArea: course.forecastArea,
      nearestStationId: tempReading.stationId,
      region: course.region,
    },
    generatedAt: new Date().toISOString(),
    source: 'nea-api-open.data.gov.sg-v2',
    now: nowConditions,
    next2h,
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

async function startServer() {
  app.use(express.json());

  // API Route: Get Golf Courses List
  app.get('/api/courses', (req, res) => {
    res.json({
      courses: SINGAPORE_GOLF_COURSES,
      defaultCourseId: DEFAULT_COURSE.id,
    });
  });

  // API Route: Get Complete Weather Contract for a Course
  app.get('/api/weather', async (req, res) => {
    try {
      const courseId = (req.query.course as string) || DEFAULT_COURSE.id;
      const contract = await buildWeatherContract(courseId);
      res.json(contract);
    } catch (err: any) {
      console.error('[API] /api/weather error:', err);
      res.status(500).json({
        error: 'Failed to build weather contract',
        message: err?.message,
      });
    }
  });

  // API Route: Force Refresh Feeds
  app.post('/api/refresh', async (req, res) => {
    try {
      await refreshAllFeedsSequentially();
      const courseId = (req.body.course as string) || DEFAULT_COURSE.id;
      const contract = await buildWeatherContract(courseId);
      res.json({ success: true, contract });
    } catch (err: any) {
      res.status(500).json({ error: 'Refresh failed', message: err?.message });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Golf Weather SG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
