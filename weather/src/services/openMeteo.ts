import type { ForecastDay, WeatherSnapshot } from "../types/weather";
import { formatCoordinateFallback, toDayLabel } from "../utils/format";

type GeocodingResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type ForecastResponse = {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    relative_humidity_2m?: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
  };
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  56: "Freezing Drizzle",
  57: "Heavy Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm Hail",
  99: "Severe Thunderstorm Hail",
};

export const getWeatherSummary = (weatherCode: number): string => WEATHER_CODE_LABELS[weatherCode] ?? "Unknown";

const buildForecast = (daily: NonNullable<ForecastResponse["daily"]>): ForecastDay[] => {
  // Arrays must stay index-aligned; cap to the shortest valid set.
  const limit = Math.min(
    daily.time.length,
    daily.weather_code.length,
    daily.temperature_2m_max.length,
    daily.temperature_2m_min.length,
    4,
  );

  return Array.from({ length: limit }, (_, index) => ({
    day: toDayLabel(daily.time[index], index),
    summary: getWeatherSummary(daily.weather_code[index]),
    maxTemp: daily.temperature_2m_max[index],
    minTemp: daily.temperature_2m_min[index],
  }));
};

const fetchForecastForCoordinates = async (
  latitude: number,
  longitude: number,
  locationName: string,
): Promise<WeatherSnapshot> => {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(latitude));
  forecastUrl.searchParams.set("longitude", String(longitude));
  forecastUrl.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,wind_speed_10m,relative_humidity_2m,weather_code",
  );
  forecastUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  forecastUrl.searchParams.set("forecast_days", "4");
  forecastUrl.searchParams.set("timezone", "auto");

  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) {
    throw new Error("Unable to load weather data right now.");
  }

  const forecastData = (await forecastResponse.json()) as ForecastResponse;
  if (!forecastData.current || !forecastData.daily) {
    throw new Error("Weather response was incomplete. Please try again.");
  }

  const { current, daily } = forecastData;
  if (
    !Array.isArray(daily.time) ||
    !Array.isArray(daily.weather_code) ||
    !Array.isArray(daily.temperature_2m_max) ||
    !Array.isArray(daily.temperature_2m_min)
  ) {
    throw new Error("Weather response format changed. Please try again.");
  }

  return {
    location: locationName,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    windSpeed: current.wind_speed_10m,
    humidity: current.relative_humidity_2m ?? null,
    summary: getWeatherSummary(current.weather_code),
    rainChance: daily.precipitation_probability_max?.[0] ?? null,
    forecast: buildForecast(daily),
  };
};

const fetchLocationNameForCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  const reverseGeocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  reverseGeocodeUrl.searchParams.set("latitude", String(latitude));
  reverseGeocodeUrl.searchParams.set("longitude", String(longitude));
  reverseGeocodeUrl.searchParams.set("language", "en");
  reverseGeocodeUrl.searchParams.set("format", "json");

  try {
    const reverseResponse = await fetch(reverseGeocodeUrl);
    if (!reverseResponse.ok) {
      return formatCoordinateFallback(latitude, longitude);
    }

    const reverseData = (await reverseResponse.json()) as GeocodingResponse;
    const result = reverseData.results?.[0];
    if (!result) {
      return formatCoordinateFallback(latitude, longitude);
    }

    const locationBits = [result.name, result.admin1, result.country].filter(Boolean);
    return locationBits.join(", ");
  } catch {
    return formatCoordinateFallback(latitude, longitude);
  }
};

export const fetchWeatherForCoordinates = async (latitude: number, longitude: number): Promise<WeatherSnapshot> => {
  const locationName = await fetchLocationNameForCoordinates(latitude, longitude);
  return fetchForecastForCoordinates(latitude, longitude, locationName);
};

export const fetchWeatherForCity = async (query: string): Promise<WeatherSnapshot> => {
  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodingUrl.searchParams.set("name", query);
  geocodingUrl.searchParams.set("count", "1");
  geocodingUrl.searchParams.set("language", "en");
  geocodingUrl.searchParams.set("format", "json");

  const geocodingResponse = await fetch(geocodingUrl);
  if (!geocodingResponse.ok) {
    throw new Error("Unable to search locations right now.");
  }

  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;
  const location = geocodingData.results?.[0];
  if (!location) {
    throw new Error("No matching city found. Try another search.");
  }

  const locationBits = [location.name, location.admin1, location.country].filter(Boolean);
  const locationName = locationBits.join(", ");
  return fetchForecastForCoordinates(location.latitude, location.longitude, locationName);
};
