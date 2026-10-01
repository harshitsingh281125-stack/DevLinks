/** @type {import('tailwindcss').Config} */
// Visual tokens live as CSS custom properties in src/styles.css so both themes
// switch in one place. Tailwind is kept for the occasional utility (sr-only, etc.).
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
