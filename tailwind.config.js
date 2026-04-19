/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111f",
          900: "#0f172a",
          800: "#172554",
        },
        cyan: {
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
        },
        sand: {
          50: "#f8fafc",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(7, 17, 31, 0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
