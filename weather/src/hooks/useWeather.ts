import { useEffect, useState } from "react";
import type { LocationPromptPreference, WeatherSnapshot } from "../types/weather";
import { fetchWeatherForCity, fetchWeatherForCoordinates } from "../services/openMeteo";
import { getCurrentPosition, getLocationErrorMessage } from "../utils/geolocation";
import { RATE_LIMIT_MESSAGE, consumeLookup, hasLookupCapacity } from "../utils/rateLimit";

const LOCATION_PROMPT_STORAGE_KEY = "weatherify.location-prompt.v1";

type LoadWeatherFn = () => Promise<WeatherSnapshot>;

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const preference = window.localStorage.getItem(LOCATION_PROMPT_STORAGE_KEY);
    if (!preference) {
      setShowLocationPrompt(true);
    }
  }, []);

  const runLookup = async (loadWeather: LoadWeatherFn) => {
    // Keep quota enforcement in one place so city search and geolocation behave the same.
    if (!hasLookupCapacity()) {
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

  const searchByCity = async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Enter a city name to search.");
      return;
    }

    await runLookup(() => fetchWeatherForCity(trimmed));
  };

  const dismissLocationPrompt = () => {
    setShowLocationPrompt(false);
    if (typeof window !== "undefined") {
      const preference: LocationPromptPreference = "declined";
      window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, preference);
    }
  };

  const useCurrentLocation = async () => {
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

      if (typeof window !== "undefined") {
        const preference: LocationPromptPreference = "accepted";
        window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, preference);
      }

      await runLookup(() => fetchWeatherForCoordinates(latitude, longitude));
    } catch (locationError) {
      setError(getLocationErrorMessage(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  return {
    weather,
    isLoading,
    isLocating,
    showLocationPrompt,
    error,
    searchByCity,
    useCurrentLocation,
    dismissLocationPrompt,
  };
};
