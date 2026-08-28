import { GolfabilityBand, GolfabilityScore } from '../types';

export function getGolfabilityBand(score: number): GolfabilityBand {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'avoid';
}

export function getBandDetails(band: GolfabilityBand) {
  switch (band) {
    case 'excellent':
      return {
        label: 'Excellent',
        action: 'Prime for Golf',
        meaning: 'Ideal playing conditions. Clear skies or light breeze, safe and dry.',
        bgLight: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        ring: 'ring-emerald-500',
        accentColor: '#059669',
      };
    case 'good':
      return {
        label: 'Good',
        action: 'Great to Play',
        meaning: 'Solid conditions for 9 or 18 holes. Low disruption risk.',
        bgLight: 'bg-teal-500/15',
        border: 'border-teal-500/30',
        text: 'text-teal-700 dark:text-teal-300',
        badgeBg: 'bg-teal-600',
        badgeText: 'text-white',
        ring: 'ring-teal-500',
        accentColor: '#0d9488',
      };
    case 'fair':
      return {
        label: 'Fair',
        action: 'Playable with Caution',
        meaning: 'Playable, but manage heat index, UV exposure, or possible light showers.',
        bgLight: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-600',
        badgeText: 'text-white',
        ring: 'ring-amber-500',
        accentColor: '#d97706',
      };
    case 'poor':
      return {
        label: 'Poor',
        action: 'Expect Disruption',
        meaning: 'Showers or high heat likely to interrupt play. Be prepared to pause.',
        bgLight: 'bg-orange-500/15',
        border: 'border-orange-500/30',
        text: 'text-orange-700 dark:text-orange-300',
        badgeBg: 'bg-orange-600',
        badgeText: 'text-white',
        ring: 'ring-orange-500',
        accentColor: '#ea580c',
      };
    case 'avoid':
    default:
      return {
        label: 'Avoid',
        action: 'Do Not Tee Off',
        meaning: 'Severe disruption: heavy rain or thunderstorms / lightning risk.',
        bgLight: 'bg-rose-500/15',
        border: 'border-rose-500/30',
        text: 'text-rose-700 dark:text-rose-300',
        badgeBg: 'bg-rose-600',
        badgeText: 'text-white',
        ring: 'ring-rose-500',
        accentColor: '#e11d48',
      };
  }
}

/**
 * Calculates 0-100 Golfability Score.
 * Rain & Thunderstorms are DEAL BREAKERS (cap/crush the score).
 */
export function calculateGolfability(params: {
  forecastLabel?: string;
  isRaining?: boolean;
  rainfallMm?: number | null;
  temperatureC?: number | null;
  heatIndexC?: number | null;
  windSpeedKmh?: number | null;
  uvIndex?: number | null;
  psi?: number | null;
  pm25?: number | null;
  uncertainty?: 'low' | 'medium' | 'high';
}): GolfabilityScore {
  let score = 96; // Base score for Singapore clear day
  const drivers: string[] = [];
  const label = (params.forecastLabel || '').toLowerCase();

  // 1. THUNDERSTORM / LIGHTNING (Absolute Deal Breaker)
  if (
    label.includes('thundery') ||
    label.includes('thunder') ||
    label.includes('lightning')
  ) {
    if (label.includes('heavy')) {
      score = 15;
      drivers.push('Heavy thunderstorm forecast (High lightning risk)');
    } else {
      score = 25;
      drivers.push('Thundery showers forecast (Lightning hazard)');
    }
  }
  // 2. RAIN / SHOWERS (Deal Breaker)
  else if (params.isRaining || (params.rainfallMm != null && params.rainfallMm > 0.1)) {
    const mm = params.rainfallMm || 0;
    if (mm >= 4.0) {
      score = 18;
      drivers.push(`Active heavy rainfall (${mm} mm/h)`);
    } else if (mm >= 1.0) {
      score = 35;
      drivers.push(`Active rain (${mm} mm/h) - greens flooded`);
    } else {
      score = 52;
      drivers.push(`Light passing rain (${mm} mm/h)`);
    }
  } else if (label.includes('heavy rain') || label.includes('heavy shower')) {
    score = 28;
    drivers.push('Heavy rain forecast');
  } else if (label.includes('showers') || label.includes('moderate rain') || label.includes('rain')) {
    score = 48;
    drivers.push(`Showers forecast (${params.forecastLabel})`);
  } else if (label.includes('light rain') || label.includes('passing showers') || label.includes('drizzle')) {
    score = 68;
    drivers.push('Light passing showers expected');
  } else if (label.includes('cloudy') || label.includes('partly cloudy')) {
    drivers.push('Cloud cover (Pleasant shade for play)');
  } else if (label.includes('fair') || label.includes('clear')) {
    drivers.push('Clear fair weather');
  }

  // 3. HEAT & HUMIDITY (Derived Heat Index)
  const hi = params.heatIndexC ?? params.temperatureC;
  if (hi != null) {
    if (hi >= 42) {
      score = Math.min(score, 50) - 15;
      drivers.push(`Dangerous heat index (${Math.round(hi)}°C) - heat stroke risk`);
    } else if (hi >= 38) {
      score -= 12;
      drivers.push(`High heat index (${Math.round(hi)}°C) - intense heat on fairways`);
    } else if (hi >= 34) {
      score -= 5;
      drivers.push(`Warm conditions (${Math.round(hi)}°C) - stay well hydrated`);
    }
  }

  // 4. WIND SPEED
  const wind = params.windSpeedKmh;
  if (wind != null) {
    if (wind >= 38) {
      score -= 15;
      drivers.push(`Strong winds (${Math.round(wind)} km/h) - club adjustment crucial`);
    } else if (wind >= 28) {
      score -= 7;
      drivers.push(`Breezy (${Math.round(wind)} km/h) - affects ball flight`);
    }
  }

  // 5. AIR QUALITY (PSI & PM2.5)
  const psi = params.psi;
  const pm25 = params.pm25;
  if ((psi != null && psi > 100) || (pm25 != null && pm25 > 55)) {
    score -= 22;
    drivers.push(`Unhealthy air quality (PSI ${psi ?? 'N/A'}, PM2.5 ${pm25 ?? 'N/A'})`);
  } else if ((psi != null && psi > 75) || (pm25 != null && pm25 > 35)) {
    score -= 6;
    drivers.push(`Moderate haze detected`);
  }

  // 6. UV INDEX
  const uv = params.uvIndex;
  if (uv != null && uv >= 10) {
    score -= 6;
    drivers.push(`Extreme UV Index (${uv}) - wide brim hat & sunscreen required`);
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const band = getGolfabilityBand(finalScore);

  // If no drivers yet, provide standard status
  if (drivers.length === 0) {
    drivers.push('Normal tropical golf conditions');
  }

  return {
    score: finalScore,
    band,
    drivers: drivers.slice(0, 3), // Top 2-3 most influential drivers
    uncertainty: params.uncertainty || 'low',
  };
}

export function getThunderstormRisk(label: string): 'none' | 'possible' | 'likely' {
  const l = label.toLowerCase();
  if (l.includes('heavy thundery') || l.includes('thunderstorm')) return 'likely';
  if (l.includes('thundery') || l.includes('showers')) return 'possible';
  return 'none';
}

export function get2HourDecision(
  score: number,
  tsRisk: 'none' | 'possible' | 'likely'
): { decision: 'play' | 'wait' | 'abandon'; verdict: string } {
  if (tsRisk === 'likely' || score < 35) {
    return {
      decision: 'abandon',
      verdict: 'Do not tee off. Thunderstorm risk or heavy rain imminent.',
    };
  }
  if (tsRisk === 'possible' || score < 65) {
    return {
      decision: 'wait',
      verdict: 'Wait or prepare for rain delay. Passing showers in the vicinity.',
    };
  }
  return {
    decision: 'play',
    verdict: 'Safe to play. Great conditions for the next 2 hours.',
  };
}
