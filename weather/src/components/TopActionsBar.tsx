import type { ResolvedTheme, ThemePreference } from "../types/weather";

type TopActionsBarProps = {
  resolvedTheme: ResolvedTheme;
  themePreference: ThemePreference;
  onToggleTheme: () => void;
};

export const TopActionsBar = ({ resolvedTheme, themePreference, onToggleTheme }: TopActionsBarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <a
        href="https://apps.apple.com/us/developer/polydez/id1683312256"
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c]"
      >
        iOS Apps
      </a>
      <a
        href="https://play.google.com/store/apps/dev?id=8534558498201265502"
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c]"
      >
        Android Apps
      </a>
      <a
        href="https://www.tekbyte.net"
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-[#7ba2c65c] px-3 py-2 text-sm font-semibold text-weather-ink transition hover:bg-[#ffffff94] dark:border-[#3f61808a] dark:hover:bg-[#1b344a9c]"
      >
        Blog
      </a>
      <button
        type="button"
        onClick={onToggleTheme}
        className="rounded-xl bg-weather-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        aria-label="Toggle light and dark theme"
        title={
          themePreference === "auto"
            ? `Auto mode (${resolvedTheme})`
            : `${themePreference === "dark" ? "Dark" : "Light"} mode`
        }
      >
        {resolvedTheme === "dark" ? "Light Theme" : "Dark Theme"}
      </button>
    </div>
  );
};
