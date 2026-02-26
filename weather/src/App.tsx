import { useState } from "react";
import type { FormEvent } from "react";
import { CurrentWeatherCard } from "./components/CurrentWeatherCard";
import { ForecastGrid } from "./components/ForecastGrid";
import { SearchPanel } from "./components/SearchPanel";
import { TopActionsBar } from "./components/TopActionsBar";
import { useTheme } from "./hooks/useTheme";
import { useWeather } from "./hooks/useWeather";

function App() {
  const [query, setQuery] = useState("");

  const { themePreference, resolvedTheme, toggleTheme } = useTheme();
  const {
    weather,
    isLoading,
    isLocating,
    showLocationPrompt,
    error,
    searchByCity,
    useCurrentLocation,
    dismissLocationPrompt,
  } = useWeather();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await searchByCity(query);
  };

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
        <TopActionsBar
          resolvedTheme={resolvedTheme}
          themePreference={themePreference}
          onToggleTheme={toggleTheme}
        />

        <SearchPanel
          query={query}
          onQueryChange={setQuery}
          onSubmit={onSubmit}
          isLoading={isLoading}
          isLocating={isLocating}
          showLocationPrompt={showLocationPrompt}
          onUseLocation={useCurrentLocation}
          onDeclineLocation={dismissLocationPrompt}
          error={error}
        />

        <CurrentWeatherCard weather={weather} />
        <ForecastGrid weather={weather} />
      </main>
    </div>
  );
}

export default App;
