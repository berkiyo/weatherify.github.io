export type LookupWindow = {
  start: number;
  count: number;
};

export type LocationPromptPreference = "accepted" | "declined";
export type ThemePreference = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ForecastDay = {
  day: string;
  summary: string;
  maxTemp: number;
  minTemp: number;
};

export type WeatherSnapshot = {
  location: string;
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  humidity: number | null;
  summary: string;
  rainChance: number | null;
  forecast: ForecastDay[];
};
