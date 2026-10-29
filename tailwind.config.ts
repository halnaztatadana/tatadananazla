import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316", // Brand Orange
          600: "#EA580C", // Brand Dark Orange
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407",
        },
        fintech: {
          primary: "#F97316",
          primaryHover: "#EA580C",
          primaryLight: "#FFEDD5",
          primarySubtle: "#FFF7ED",
          income: "#10B981",
          expense: "#F43F5E",
          transfer: "#3B82F6",
          warning: "#F59E0B",
          surface: "#FFFFFF",
          subtle: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover": "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
        brand: "0 10px 25px -5px rgba(249, 115, 22, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
