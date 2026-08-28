/**
 * Haversine formula to compute great-circle distance between two lat/lon points in km.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function knotsToKmh(knots: number | null | undefined): number | null {
  if (knots == null || isNaN(knots)) return null;
  return Math.round(knots * 1.852 * 10) / 10;
}

/**
 * Calculates derived Heat Index in Celsius using the standard Steadman/Rothfusz regression equation
 */
export function calculateHeatIndex(tempC: number, humidityPct: number): number {
  // Convert Celsius to Fahrenheit
  const T = (tempC * 9) / 5 + 32;
  const R = humidityPct;

  // Simple Steadman formula first
  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);

  // If average of HI and T >= 80F, use full Rothfusz regression
  if ((HI + T) / 2 >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * R -
      0.22475541 * T * R -
      0.00683783 * T * T -
      0.05481717 * R * R +
      0.00122874 * T * T * R +
      0.00085282 * T * R * R -
      0.00000199 * T * T * R * R;

    // Adjustments for low RH / high RH
    if (R < 13 && T >= 80 && T <= 112) {
      const adj = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      HI -= adj;
    } else if (R > 85 && T >= 80 && T <= 87) {
      const adj = ((R - 85) / 10) * ((87 - T) / 5);
      HI += adj;
    }
  }

  // Convert back to Celsius
  const heatIndexC = ((HI - 32) * 5) / 9;
  return Math.round(Math.max(heatIndexC, tempC) * 10) / 10;
}

export function degreesToCardinal(deg: number | null): string | null {
  if (deg == null || isNaN(deg)) return null;
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}
