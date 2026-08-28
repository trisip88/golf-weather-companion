export type Region = 'north' | 'south' | 'east' | 'west' | 'central';

export interface GolfCourse {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  forecastArea: string;
  region: Region;
  holes: number;
  address: string;
}

export type GolfabilityBand = 'excellent' | 'good' | 'fair' | 'poor' | 'avoid';

export type AlertType = 'thunderstorm' | 'heat' | 'uv' | 'airQuality' | 'wind' | 'rain';
export type AlertSeverity = 'advisory' | 'high' | 'unsafe';
export type DataProvenance = 'observed' | 'forecast' | 'derived';

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  basis: DataProvenance;
  startsAt?: string;
  endsAt?: string;
}

export interface WindReading {
  speedKmh: number | null;
  gustKmh: number | null;
  directionDeg: number | null;
  cardinal: string | null;
}

export interface NowConditions {
  observedAt: string;
  temperatureC: number | null;
  humidityPct: number | null;
  heatIndexC: number | null;
  heatIndexDerived: boolean;
  rainfallMm: number | null;
  isRaining: boolean;
  wind: WindReading;
  uvIndex: number | null;
  psi: number | null;
  pm25: number | null;
  stationDistanceKm: number | null;
  stationName: string | null;
}

export interface Next2HourForecast {
  validFrom: string;
  validTo: string;
  area: string;
  forecastLabel: string;
  thunderstormRisk: 'none' | 'possible' | 'likely';
  basis: 'forecast';
  decision: 'play' | 'wait' | 'abandon';
  score: number;
  drivers: string[];
}

export interface GolfabilityScore {
  score: number;
  band: GolfabilityBand;
  drivers: string[];
  uncertainty?: 'low' | 'medium' | 'high';
}

export interface PeriodForecast {
  periodStart: string;
  periodEnd: string;
  timeLabel: string;
  forecastLabel: string;
  regionalLabel: string;
  temperatureRangeC: [number, number];
  humidityRangePct: [number, number];
  windSpeedRangeKmh: [number, number];
  golfability: GolfabilityScore;
}

export interface DayOutlook {
  date: string;
  dayName: string;
  forecastLabel: string;
  temperatureRangeC: [number, number];
  humidityRangePct: [number, number];
  windSpeedRangeKmh: [number, number];
  golfability: GolfabilityScore;
  periods?: PeriodForecast[];
}

export interface RecommendedWindow {
  start: string;
  end: string;
  timeLabel: string;
  score: number;
  band: GolfabilityBand;
  reason: string;
}

export interface FeedStaleness {
  feed: string;
  observedAt: string;
  isStale: boolean;
}

export interface NormalizedWeatherContract {
  course: {
    name: string;
    id: string;
    lat: number;
    lon: number;
    forecastArea: string;
    nearestStationId: string | null;
    region: Region;
  };
  generatedAt: string;
  source: string;
  now: NowConditions;
  next2h: Next2HourForecast;
  next24h: PeriodForecast[];
  next4d: DayOutlook[];
  recommendedWindows: RecommendedWindow[];
  alerts: Alert[];
  daylight: {
    sunriseAt: string;
    sunsetAt: string;
  };
  staleness: FeedStaleness[];
}
