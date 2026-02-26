import type { WeatherSnapshot } from "../types/weather";
import { formatTemp } from "../utils/format";

type ForecastGridProps = {
  weather: WeatherSnapshot | null;
};

export const ForecastGrid = ({ weather }: ForecastGridProps) => {
  return (
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
  );
};
