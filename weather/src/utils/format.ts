export const formatTemp = (value: number): string => `${Math.round(value)} C`;

export const formatWind = (value: number): string => `${Math.round(value)} km/h`;

export const formatPercent = (value: number | null): string => (value === null ? "--" : `${Math.round(value)}%`);

export const formatCoordinateFallback = (latitude: number, longitude: number): string =>
  `Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

export const toDayLabel = (dateString: string, index: number): string => {
  if (index === 0) {
    return "Today";
  }

  // Midday avoids day-shift edge cases around timezone offsets.
  const safeDate = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(safeDate);
};
