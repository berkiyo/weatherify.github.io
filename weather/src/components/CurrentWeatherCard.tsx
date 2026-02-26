import type { WeatherSnapshot } from "../types/weather";
import { formatPercent, formatTemp, formatWind } from "../utils/format";

type CurrentWeatherCardProps = {
  weather: WeatherSnapshot | null;
};

export const CurrentWeatherCard = ({ weather }: CurrentWeatherCardProps) => {
  const metrics = [
    { label: "Humidity", value: formatPercent(weather?.humidity ?? null) },
    { label: "Wind", value: weather ? formatWind(weather.windSpeed) : "--" },
    { label: "Rain Chance", value: formatPercent(weather?.rainChance ?? null) },
  ];

  return (
    <section
      className="grid gap-4 rounded-[20px] border border-[#7ba2c647] bg-gradient-to-br from-[#ffffffe6] to-[#f6fbffeb] p-5 shadow-weather dark:border-[#3f61807a] dark:from-[#11283ce6] dark:to-[#0c1f31eb] dark:shadow-[0_16px_30px_rgba(2,8,16,0.5)]"
      aria-label="Current weather"
    >
      <div className="grid gap-1">
        <p className="m-0 text-sm font-semibold text-weather-muted">{weather?.location ?? "Search a city to start"}</p>
        <p className="m-0 text-6xl font-extrabold leading-none text-weather-ink sm:text-7xl">
          {weather ? formatTemp(weather.temperature) : "--"}
        </p>
        <p className="m-0 text-lg font-bold text-[#175f98] dark:text-[#76c7ff]">{weather?.summary ?? "No weather loaded"}</p>
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
  );
};
