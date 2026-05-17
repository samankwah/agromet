/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        neo: {
          bg: "var(--neo-bg)",
          "bg-soft": "var(--neo-bg-soft)",
          surface: "var(--neo-surface)",
          text: "var(--neo-text)",
          muted: "var(--neo-muted)",
          border: "var(--neo-border)",
          focus: "var(--neo-focus)",
          accent: "var(--neo-accent)",
          "accent-strong": "var(--neo-accent-strong)",
          teal: "var(--neo-teal)",
          warning: "var(--neo-warning)",
          danger: "var(--neo-danger)",
        },
      },
      boxShadow: {
        neo: "14px 14px 30px var(--neo-shadow-dark), -14px -14px 30px var(--neo-shadow-light)",
        "neo-soft": "8px 8px 20px rgba(117, 133, 145, 0.2), -8px -8px 20px rgba(255, 255, 255, 0.82)",
        "neo-inset": "inset 7px 7px 14px rgba(117, 133, 145, 0.24), inset -7px -7px 14px rgba(255, 255, 255, 0.86)",
        "neo-pressed": "inset 5px 5px 10px rgba(117, 133, 145, 0.24), inset -5px -5px 10px rgba(255, 255, 255, 0.88)",
      },
      borderRadius: {
        neo: "20px",
        "neo-lg": "28px",
      },
    },
  },
  plugins: [],
}
