/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#281432",
        primary: {
          light: "#bf4596",
          DEFAULT: "#FF00C3",
          dark: "#7c2b61",
        },
        secondary: {
          light: "#ffb3ba",
          DEFAULT: "#ff6b6b",
          dark: "#c0392b",
        },
        accent: {
          light: "#ffe599",
          DEFAULT: "#ffcc00",
          dark: "#b37f00",
        },
        neutral: {
          light: "#f5f5f5",
          DEFAULT: "#e0e0e0",
          dark: "#9e9e9e",
        },
      },
      fontFamily: {
        sans: [
          "Amatic SC",
          "Montserrat",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
    animation: {
      "fade-in": "fadeIn 0.5s ease-in-out",
    },
    keyframes: {
      fadeIn: {
        "0%": { opacity: 0, transform: "translateY(10px)" },
        "100%": { opacity: 1, transform: "translateY(0)" },
      },
    },
  },
  plugins: [],
};
