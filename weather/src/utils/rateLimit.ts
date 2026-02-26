import type { LookupWindow } from "../types/weather";

const LOOKUP_LIMIT = 1000;
const LIMIT_WINDOW_MS = 60 * 60 * 1000;
const LOOKUP_STORAGE_KEY = "weatherify.lookup-window.v2";

export const RATE_LIMIT_MESSAGE = "Too many requests. Please try again in one hour.";

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

    // Reset the counter when the rolling window expires.
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

export const hasLookupCapacity = (): boolean => {
  const state = readLookupWindow();
  return state.count < LOOKUP_LIMIT;
};

export const consumeLookup = (): void => {
  const state = readLookupWindow();
  const nextState: LookupWindow = {
    ...state,
    count: state.count + 1,
  };

  writeLookupWindow(nextState);
};
