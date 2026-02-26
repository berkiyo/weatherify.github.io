/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        weather: {
          ink: "#10243e",
          muted: "#4a6784",
          accent: "#0b6ec1",
        },
      },
      boxShadow: {
        weather: "0 16px 30px rgba(14, 59, 100, 0.1)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 14s ease-in-out infinite",
        rise: "rise 520ms ease-out both",
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Nunito Sans"', '"Segoe UI"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
