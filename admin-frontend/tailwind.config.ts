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
          dark: "#1d4ed8",
          light: "#3b82f6",
        },
        secondary: "#444653",
        background: "#f5f5f5",
        card: "#ffffff",
        text: "#0b1c30",
      },
    },
  },
  plugins: [],
};
export default config;