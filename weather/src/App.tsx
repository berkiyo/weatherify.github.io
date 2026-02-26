import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const LOOKUP_LIMIT = 1000;
const LIMIT_WINDOW_MS = 60 * 60 * 1000;
const LOOKUP_STORAGE_KEY = "weatherify.lookup-window.v2";
const LOCATION_PROMPT_STORAGE_KEY = "weatherify.location-prompt.v1";
const THEME_STORAGE_KEY = "weatherify.theme.v1";
const RATE_LIMIT_MESSAGE = "Too many requests. Please try again in one hour.";

type LookupWindow = {
  start: number;
  count: number;
};

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

type LocationPromptPreference = "accepted" | "declined";
type ThemePreference = "auto" | "light" | "dark";

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

type ForecastDay = {
  day: string;
  summary: string;
  maxTemp: number;
  minTemp: number;
};

type WeatherSnapshot = {
  location: string;
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  humidity: number | null;
  weatherCode: number;
  rainChance: number | null;
  forecast: ForecastDay[];
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

const getWeatherSummary = (weatherCode: number): string => WEATHER_CODE_LABELS[weatherCode] ?? "Unknown";

const formatTemp = (value: number): string => `${Math.round(value)} C`;
const formatWind = (value: number): string => `${Math.round(value)} km/h`;
const formatPercent = (value: number | null): string => (value === null ? "--" : `${Math.round(value)}%`);
const formatCoordinateFallback = (latitude: number, longitude: number): string =>
  `Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

const toDayLabel = (dateString: string, index: number): string => {
  if (index === 0) {
    return "Today";
  }

  const safeDate = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(safeDate);
};

const createFreshLookupWindow = (): LookupWindow => ({
  start: Date.now(),
  count: 0,
});

const readLookupWindow = (): LookupWindow => {
  if (typeof window === "undefined") {
    return createFreshLookupWindow();
  }

  try {
    const raw = window.localStorage.getItem(LOOKUP_STORAGE_KEY);
    if (!raw) {
      return createFreshLookupWindow();
    }

    const parsed = JSON.parse(raw) as LookupWindow;
    if (typeof parsed.start !== "number" || typeof parsed.count !== "number") {
      return createFreshLookupWindow();
    }

    if (Date.now() - parsed.start >= LIMIT_WINDOW_MS) {
      return createFreshLookupWindow();
    }

    return parsed;
  } catch {
    return createFreshLookupWindow();
  }
};

const writeLookupWindow = (windowState: LookupWindow): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOOKUP_STORAGE_KEY, JSON.stringify(windowState));
};

const getRemainingLookups = (): number => {
  const state = readLookupWindow();
  return Math.max(0, LOOKUP_LIMIT - state.count);
};

const consumeLookup = (): number => {
  const state = readLookupWindow();
  const nextState: LookupWindow = {
    ...state,
    count: state.count + 1,
  };
  writeLookupWindow(nextState);
  return Math.max(0, LOOKUP_LIMIT - nextState.count);
};

const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "auto";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return "auto";
};

const getLocationErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Number((error as { code?: unknown }).code);
    if (code === 1) {
      return "Location permission was denied.";
    }
    if (code === 2) {
      return "Location is unavailable right now.";
    }
    if (code === 3) {
      return "Location request timed out. Try again.";
    }
  }

  return "Unable to detect your location right now.";
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

  const limit = Math.min(
    daily.time.length,
    daily.weather_code.length,
    daily.temperature_2m_max.length,
    daily.temperature_2m_min.length,
    4,
  );

  const forecast: ForecastDay[] = Array.from({ length: limit }, (_, index) => ({
    day: toDayLabel(daily.time[index], index),
    summary: getWeatherSummary(daily.weather_code[index]),
    maxTemp: daily.temperature_2m_max[index],
    minTemp: daily.temperature_2m_min[index],
  }));

  return {
    location: locationName,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    windSpeed: current.wind_speed_10m,
    humidity: current.relative_humidity_2m ?? null,
    weatherCode: current.weather_code,
    rainChance: daily.precipitation_probability_max?.[0] ?? null,
    forecast,
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

const fetchWeatherForCity = async (query: string): Promise<WeatherSnapshot> => {
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

const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 300000,
    });
  });

function App() {
  const [query, setQuery] = useState("");
  const [themePreference, setThemePreference] = useState<ThemePreference>("auto");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedTheme = themePreference === "auto" ? (systemPrefersDark ? "dark" : "light") : themePreference;

  useEffect(() => {
    setThemePreference(getStoredThemePreference());

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const preference = window.localStorage.getItem(LOCATION_PROMPT_STORAGE_KEY);
    if (!preference) {
      setShowLocationPrompt(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", onChange);
    } else {
      mediaQuery.addListener(onChange);
    }

    return () => {
      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", onChange);
      } else {
        mediaQuery.removeListener(onChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    if (themePreference === "auto") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    }
  }, [resolvedTheme, themePreference]);

  const runLookup = async (loadWeather: () => Promise<WeatherSnapshot>) => {
    const remaining = getRemainingLookups();
    if (remaining <= 0) {
      setError(RATE_LIMIT_MESSAGE);
      if (typeof window !== "undefined") {
        window.alert(RATE_LIMIT_MESSAGE);
      }
      return;
    }

    setError(null);
    setIsLoading(true);
    consumeLookup();

    try {
      const snapshot = await loadWeather();
      setWeather(snapshot);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setThemePreference(resolvedTheme === "dark" ? "light" : "dark");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Enter a city name to search.");
      return;
    }

    await runLookup(() => fetchWeatherForCity(trimmed));
  };

  const handleLocationDecline = () => {
    setShowLocationPrompt(false);
    if (typeof window !== "undefined") {
      const preference: LocationPromptPreference = "declined";
      window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, preference);
    }
  };

  const handleUseMyLocation = async () => {
    setShowLocationPrompt(false);

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setError(null);
    setIsLocating(true);

    try {
      const position = await getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const locationName = await fetchLocationNameForCoordinates(latitude, longitude);
      if (typeof window !== "undefined") {
        const preference: LocationPromptPreference = "accepted";
        window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, preference);
      }
      await runLookup(() => fetchForecastForCoordinates(latitude, longitude, locationName));
    } catch (locationError) {
      setError(getLocationErrorMessage(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  const metrics = [
    { label: "Humidity", value: formatPercent(weather?.humidity ?? null) },
    { label: "Wind", value: weather ? formatWind(weather.windSpeed) : "--" },
    { label: "Rain Chance", value: formatPercent(weather?.rainChance ?? null) },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-9 sm:px-6">
      <div
        className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 animate-drift rounded-full bg-[radial-gradient(circle_at_40%_40%,#ffd88f_0%,#ffc278_55%,transparent_75%)] opacity-50 blur-3xl dark:bg-[radial-gradient(circle_at_40%_40%,#dc8750_0%,#8c3f16_56%,transparent_76%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 animate-drift rounded-full bg-[radial-gradient(circle_at_45%_45%,#89ddf7_0%,#47b8ea_58%,transparent_78%)] opacity-50 blur-3xl [animation-delay:2s] dark:bg-[radial-gradient(circle_at_45%_45%,#4fa4d5_0%,#296995_58%,transparent_78%)]"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto grid w-full max-w-5xl gap-5 animate-rise">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href="https://apps.apple.com/us/developer/polydez/id1683312256"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c]"
          >
            iOS Apps
          </a>
          <a
            href="https://play.google.com/store/apps/dev?id=8534558498201265502"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c]"
          >
            Android Apps
          </a>
          <a
            href="https://www.tekbyte.net"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c]"
          >
            Blog
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl bg-weather-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            aria-label="Toggle light and dark theme"
            title={
              themePreference === "auto"
                ? `Auto mode (${resolvedTheme})`
                : `${themePreference === "dark" ? "Dark" : "Light"} mode`
            }
          >
            {resolvedTheme === "dark" ? "Light Theme" : "Dark Theme"}
          </button>
        </div>

        <header className="grid gap-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-weather-accent">Weatherify</p>
          <h1 className="m-0 max-w-[15ch] text-4xl font-extrabold leading-[1.08] text-weather-ink sm:text-5xl">
            Clean forecasts for your day.
          </h1>
          <p className="m-0 max-w-[56ch] text-base text-weather-muted">
            Search any city and get current conditions plus a simple 4 day outlook.
          </p>

          <form className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="city">
              Search city
            </label>
            <input
              id="city"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city, ZIP, or airport"
              className="h-12 rounded-2xl border border-[#d4e4f4] bg-[#f8fbff] px-4 text-weather-ink outline-none transition placeholder:text-[#6b8aa8] focus:border-[#4db8e8] focus:ring-4 focus:ring-[#4db8e840] dark:border-[#2b4760] dark:bg-[#0f2537] dark:placeholder:text-[#8facc7] dark:focus:border-[#6fcaff] dark:focus:ring-[#6fcaff33]"
            />
            <button
              type="submit"
              disabled={isLoading || isLocating}
              className="h-12 rounded-2xl bg-gradient-to-br from-[#1e80d8] to-[#20b7e8] px-5 font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105 dark:from-[#2d90e8] dark:to-[#3eb9e9] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              {isLoading ? "Loading..." : "Check Weather"}
            </button>
          </form>

          {showLocationPrompt ? (
            <div className="grid gap-3 rounded-2xl border border-[#7ba2c647] bg-[#ffffffa3] p-4 dark:border-[#3f61806e] dark:bg-[#13283ac2]">
              <p className="m-0 text-sm text-weather-ink">
                Would you like us to auto-detect your location for local weather?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleUseMyLocation()}
                  disabled={isLoading || isLocating}
                  className="rounded-xl bg-weather-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Yes, use my location
                </button>
                <button
                  type="button"
                  onClick={handleLocationDecline}
                  disabled={isLoading || isLocating}
                  className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  No thanks
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleUseMyLocation()}
              disabled={isLoading || isLocating}
              className="w-fit rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isLocating ? "Detecting location..." : "Use my location"}
            </button>
          )}
          {error ? <p className="m-0 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
        </header>

        <section
          className="grid gap-4 rounded-[20px] border border-[#7ba2c647] bg-gradient-to-br from-[#ffffffe6] to-[#f6fbffeb] p-5 shadow-weather dark:border-[#3f61807a] dark:from-[#11283ce6] dark:to-[#0c1f31eb] dark:shadow-[0_16px_30px_rgba(2,8,16,0.5)]"
          aria-label="Current weather"
        >
          <div className="grid gap-1">
            <p className="m-0 text-sm font-semibold text-weather-muted">{weather?.location ?? "Search a city to start"}</p>
            <p className="m-0 text-6xl font-extrabold leading-none text-weather-ink sm:text-7xl">
              {weather ? formatTemp(weather.temperature) : "--"}
            </p>
            <p className="m-0 text-lg font-bold text-[#175f98] dark:text-[#76c7ff]">
              {weather ? getWeatherSummary(weather.weatherCode) : "No weather loaded"}
            </p>
            <p className="m-0 text-weather-muted">
              {weather
                ? `Feels like ${formatTemp(weather.apparentTemperature)}`
                : "Current conditions will appear here once a location is found."}
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3" aria-label="Weather details">
            {metrics.map((item) => (
              <li key={item.label} className="grid gap-1.5 rounded-2xl bg-[#d5e9fa6b] p-3 dark:bg-[#1c334866]">
                <span className="text-xs text-weather-muted">{item.label}</span>
                <strong className="text-base text-weather-ink">{item.value}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="4 day forecast">
          {(weather?.forecast ?? []).map((item) => (
            <article
              key={item.day}
              className="grid gap-1.5 rounded-2xl border border-[#7ba2c63d] bg-[#ffffffad] px-3 py-3 text-center dark:border-[#3f61806e] dark:bg-[#152b3ec2]"
            >
              <p className="m-0 text-sm text-weather-muted">{item.day}</p>
              <span className="text-[1rem] text-weather-ink">{item.summary}</span>
              <strong className="text-base text-weather-ink">
                {formatTemp(item.maxTemp)} / {formatTemp(item.minTemp)}
              </strong>
            </article>
          ))}
          {!weather || weather.forecast.length === 0 ? (
            <p className="col-span-2 m-0 rounded-2xl border border-[#7ba2c63d] bg-[#ffffffad] px-4 py-4 text-center text-sm text-weather-muted dark:border-[#3f61806e] dark:bg-[#152b3ec2] sm:col-span-4">
              4 day forecast will appear after your first search.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
