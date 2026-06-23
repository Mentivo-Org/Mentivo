import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0077CB",
          dark: "#005a9c",
          light: "#39b8fd",
          muted: "#e6f4ff"
        },
        secondary: {
          DEFAULT: "#64748b",
          light: "#94a3b8"
        },
        background: "#f8fafc",
        card: "rgba(255, 255, 255, 0.8)",
        cardSolid: "#ffffff",
        text: "#0f172a",
        border: "#e2e8f0"
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium-hover': '0 10px 30px -4px rgba(0, 119, 203, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
};
export default config;