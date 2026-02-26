import type { FormEventHandler } from "react";

type SearchPanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isLoading: boolean;
  isLocating: boolean;
  showLocationPrompt: boolean;
  onUseLocation: () => Promise<void>;
  onDeclineLocation: () => void;
  error: string | null;
};

export const SearchPanel = ({
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  isLocating,
  showLocationPrompt,
  onUseLocation,
  onDeclineLocation,
  error,
}: SearchPanelProps) => {
  return (
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
          onChange={(event) => onQueryChange(event.target.value)}
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
          <p className="m-0 text-sm text-weather-ink">Would you like us to auto-detect your location for local weather?</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onUseLocation()}
              disabled={isLoading || isLocating}
              className="rounded-xl bg-weather-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Yes, use my location
            </button>
            <button
              type="button"
              onClick={onDeclineLocation}
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
          onClick={() => void onUseLocation()}
          disabled={isLoading || isLocating}
          className="w-fit rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isLocating ? "Detecting location..." : "Use my location"}
        </button>
      )}

      {error ? <p className="m-0 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
    </header>
  );
};
