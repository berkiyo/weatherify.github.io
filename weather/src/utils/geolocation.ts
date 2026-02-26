export const getCurrentPosition = (): Promise<GeolocationPosition> =>
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

export const getLocationErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Number((error as { code?: unknown }).code);

    // Browser geolocation uses numeric codes for permission/unavailable/timeout.
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
