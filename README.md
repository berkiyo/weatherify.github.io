# Weatherify

Simple weather app built with React + TypeScript + Vite and deployed to GitHub Pages.

Check it out here: https://weather.berk.au

## How does it work?


1. Visit "https://weather.berk.au"
2. Type in a city name (e.g. Melbourne)
3. The backend looks up that place using Open-Meteo geocoding
4. Fetches current weather + a 4-day forecast for that location
5. Shows an easy-to-read dashboard with temperature, conditions, wind, humidity, rain chance, and daily highs/lows.

> [!NOTE]
> Automatic location detection is available but still WIP. Need to fix!

## How the codebase is organized

Main app code is in `weather/`.

- `weather/src/App.tsx`
  - Page layout and wiring between UI + hooks.
- `weather/src/hooks/useWeather.ts`
  - Main weather logic/state (loading, errors, search, location flow).
- `weather/src/services/openMeteo.ts`
  - API calls to Open-Meteo (city search, reverse geocode, forecast fetch).
- `weather/src/components/*`
  - UI pieces:
    - `SearchPanel` for input/location prompt
    - `CurrentWeatherCard` for current conditions
    - `ForecastGrid` for 4-day outlook
    - `TopActionsBar` for theme toggle and top actions
- `weather/src/hooks/useTheme.ts`
  - Light/dark theme handling (system-aware, persisted in localStorage).
- `weather/src/utils/*`
  - Helpers:
    - `geolocation.ts`: browser geolocation wrappers + friendly error messages
    - `format.ts`: temperature/wind/percent/date formatting
    - `rateLimit.ts`: local lookup throttling (500 requests/hour in localStorage)
- `weather/src/types/weather.ts`
  - Shared TypeScript types.

## Data flow (high level)

1. User searches city or taps "Use my location".
2. `useWeather` triggers an API call via `openMeteo.ts`.
3. Raw API response is transformed into a `WeatherSnapshot`.
4. React state updates, and UI components render the new weather data.

## Notes on behavior

- Geolocation prompt preference is saved in localStorage.
- Theme preference is saved in localStorage (`auto`, `light`, `dark`).
- A client-side lookup cap is enforced to reduce abuse:
  - 500 lookups per rolling 1-hour window (localStorage-based).

## Run locally

From the repo root:

```bash
cd weather
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build for production

```bash
cd weather
npm run build
npm run preview
```

Push to GitHub (main branch), then let GitHub actions take care of the rest (see the dotfile).
