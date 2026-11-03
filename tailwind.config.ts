import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        foreground: "#F1F5F9",
        sidebar: {
          DEFAULT: "#111620",
          border: "#1C2433",
          active: "#1A2234",
          hover: "#151B27",
        },
        card: {
          DEFAULT: "#171E2B",
          border: "#232D40",
          hover: "#1D2637",
        },
        primary: {
          DEFAULT: "#4F8CFF",
          hover: "#3B7CF6",
          subtle: "rgba(79, 140, 255, 0.12)",
        },
        success: {
          DEFAULT: "#22C55E",
          hover: "#16A34A",
          subtle: "rgba(34, 197, 94, 0.12)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          subtle: "rgba(245, 158, 11, 0.12)",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          subtle: "rgba(239, 68, 68, 0.12)",
        },
        border: "#222B3D",
        muted: {
          DEFAULT: "#1C2536",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#1F293D",
          foreground: "#E2E8F0",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;

