const metrics = [
  { label: "Humidity", value: "62%" },
  { label: "Wind", value: "11 km/h" },
  { label: "Rain Chance", value: "20%" },
];

const forecast = [
  { day: "Today", summary: "Clouds", temp: 18 },
  { day: "Fri", summary: "Clear", temp: 21 },
  { day: "Sat", summary: "Rain", temp: 17 },
  { day: "Sun", summary: "Wind", temp: 15 },
];

const formatTemp = (value: number) => `${value}\u00B0`;

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-9 sm:px-6">
      <div
        className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 animate-drift rounded-full bg-[radial-gradient(circle_at_40%_40%,#ffd88f_0%,#ffc278_55%,transparent_75%)] opacity-50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 animate-drift rounded-full bg-[radial-gradient(circle_at_45%_45%,#89ddf7_0%,#47b8ea_58%,transparent_78%)] opacity-50 blur-3xl [animation-delay:2s]"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto grid w-full max-w-5xl gap-5 animate-rise">
        <header className="grid gap-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-weather-accent">Weatherify</p>
          <h1 className="m-0 max-w-[15ch] text-4xl font-extrabold leading-[1.08] text-weather-ink sm:text-5xl">
            Clean forecasts for your day.
          </h1>
          <p className="m-0 max-w-[56ch] text-base text-weather-muted">
            Check weather conditions in seconds with a lightweight, easy interface.
          </p>

          <form className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="city">
              Search city
            </label>
            <input
              id="city"
              type="text"
              placeholder="Search city, ZIP, or airport"
              className="h-12 rounded-2xl border border-[#d4e4f4] bg-[#f8fbff] px-4 text-weather-ink outline-none transition focus:border-[#4db8e8] focus:ring-4 focus:ring-[#4db8e840]"
            />
            <button
              type="submit"
              className="h-12 rounded-2xl bg-gradient-to-br from-[#1e80d8] to-[#20b7e8] px-5 font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105"
            >
              Check Weather
            </button>
          </form>
        </header>

        <section
          className="grid gap-4 rounded-[20px] border border-[#7ba2c647] bg-gradient-to-br from-[#ffffffe6] to-[#f6fbffeb] p-5 shadow-weather"
          aria-label="Current weather"
        >
          <div className="grid gap-1">
            <p className="m-0 text-sm font-semibold text-weather-muted">San Francisco, CA</p>
            <p className="m-0 text-6xl font-extrabold leading-none text-weather-ink sm:text-7xl">{formatTemp(18)}</p>
            <p className="m-0 text-lg font-bold text-[#175f98]">Partly Cloudy</p>
            <p className="m-0 text-weather-muted">
              Feels like {formatTemp(17)} | High {formatTemp(20)} | Low {formatTemp(14)}
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3" aria-label="Weather details">
            {metrics.map((item) => (
              <li key={item.label} className="grid gap-1.5 rounded-2xl bg-[#d5e9fa6b] p-3">
                <span className="text-xs text-weather-muted">{item.label}</span>
                <strong className="text-base text-weather-ink">{item.value}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="4 day forecast">
          {forecast.map((item) => (
            <article
              key={item.day}
              className="grid gap-1.5 rounded-2xl border border-[#7ba2c63d] bg-[#ffffffad] px-3 py-3 text-center"
            >
              <p className="m-0 text-sm text-weather-muted">{item.day}</p>
              <span className="text-[1rem] text-weather-ink">{item.summary}</span>
              <strong className="text-base text-weather-ink">{formatTemp(item.temp)}</strong>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
