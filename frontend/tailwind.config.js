/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Space Grotesk"',
          '"Noto Sans"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        local: ['"Noto Sans"', '"Space Grotesk"', "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.375rem" }],
      },
      colors: {
        neo: {
          bg: "rgb(var(--neo-bg-rgb) / <alpha-value>)",
          "bg-soft": "rgb(var(--neo-bg-soft-rgb) / <alpha-value>)",
          surface: "rgb(var(--neo-surface-rgb) / <alpha-value>)",
          "surface-strong": "rgb(var(--neo-surface-strong-rgb) / <alpha-value>)",
          text: "rgb(var(--neo-text-rgb) / <alpha-value>)",
          muted: "rgb(var(--neo-muted-rgb) / <alpha-value>)",
          border: "rgb(var(--neo-border-rgb) / <alpha-value>)",
          focus: "rgb(var(--neo-focus-rgb) / <alpha-value>)",
          accent: "rgb(var(--neo-accent-rgb) / <alpha-value>)",
          "accent-strong": "rgb(var(--neo-accent-strong-rgb) / <alpha-value>)",
          teal: "rgb(var(--neo-teal-rgb) / <alpha-value>)",
          warning: "rgb(var(--neo-warning-rgb) / <alpha-value>)",
          danger: "rgb(var(--neo-danger-rgb) / <alpha-value>)",
          "on-accent": "rgb(var(--neo-on-accent-rgb) / <alpha-value>)",
          "on-teal": "rgb(var(--neo-on-teal-rgb) / <alpha-value>)",
          "on-warning": "rgb(var(--neo-on-warning-rgb) / <alpha-value>)",
          "on-danger": "rgb(var(--neo-on-danger-rgb) / <alpha-value>)",
        },
      },
      boxShadow: {
        // The four neo-* shadow tokens now resolve to `none`: cards are
        // outline-first. Kept so existing utility usages stay valid.
        neo: "var(--neo-shadow)",
        "neo-soft": "var(--neo-shadow-soft)",
        "neo-inset": "var(--neo-shadow-inset)",
        "neo-pressed": "var(--neo-shadow-pressed)",
        // Active/pressed affordance, replacing the old inset neumorphic press.
        "neo-active": "var(--neo-ring-active)",
      },
      borderRadius: {
        neo: "20px",
        "neo-sm": "12px",
        "neo-lg": "24px",
      },
    },
  },
  plugins: [],
}
