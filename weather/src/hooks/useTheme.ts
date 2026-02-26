import { useEffect, useState } from "react";
import type { ResolvedTheme, ThemePreference } from "../types/weather";

const THEME_STORAGE_KEY = "weatherify.theme.v1";

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

const resolveTheme = (preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme => {
  if (preference === "auto") {
    return systemPrefersDark ? "dark" : "light";
  }

  return preference;
};

export const useTheme = () => {
  const [themePreference, setThemePreference] = useState<ThemePreference>("auto");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  const resolvedTheme = resolveTheme(themePreference, systemPrefersDark);

  useEffect(() => {
    setThemePreference(getStoredThemePreference());
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

    // Root class drives Tailwind's dark variants and CSS token overrides.
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    if (themePreference === "auto") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    }
  }, [resolvedTheme, themePreference]);

  const toggleTheme = () => {
    setThemePreference((current) => (resolveTheme(current, systemPrefersDark) === "dark" ? "light" : "dark"));
  };

  return {
    themePreference,
    resolvedTheme,
    toggleTheme,
  };
};
