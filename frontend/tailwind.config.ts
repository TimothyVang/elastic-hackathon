import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Raw Form palette
        "base": "#E4E2DD",
        "base-dark": "#D9D6D0",
        "primary": "#1E1E1E",
        "accent-red": "#DB4A2B",
        "accent-orange": "#F8A348",
        "accent-pink": "#FF89A9",
        "muted": "#444444",
        "divider": "rgba(30, 30, 30, 0.12)",
        // Backward compat aliases (so old pages don't fully break)
        "surface": "#E4E2DD",
        "surface-raised": "#D9D6D0",
        "surface-overlay": "rgba(30, 30, 30, 0.05)",
        "border-subtle": "rgba(30, 30, 30, 0.12)",
        "cyber-red": "#DB4A2B",
        "cyber-cyan": "#1E1E1E",
        "cyber-gold": "#F8A348",
        "cyber-violet": "#FF89A9",
        "glow-red": "rgba(219, 74, 43, 0.15)",
        "glow-cyan": "rgba(30, 30, 30, 0.08)",
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        sans: ["'Satoshi'", "sans-serif"],
      },
      boxShadow: {
        "brutal": "4px 4px 0 0 #1E1E1E",
        "brutal-sm": "2px 2px 0 0 #1E1E1E",
        "brutal-red": "4px 4px 0 0 #DB4A2B",
        "glass": "0 4px 30px rgba(0, 0, 0, 0.08)",
        "neon-red": "0 0 0 1px rgba(219, 74, 43, 0.3)",
        "neon-cyan": "0 0 0 1px rgba(30, 30, 30, 0.1)",
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "blob-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "translate(0, 0) scale(1)" },
          "33%": { opacity: "0.8", transform: "translate(15px, -15px) scale(1.03)" },
          "66%": { opacity: "0.6", transform: "translate(-10px, 10px) scale(0.98)" },
        },
        "blob-pulse-alt": {
          "0%, 100%": { opacity: "0.4", transform: "translate(0, 0) scale(1)" },
          "50%": { opacity: "0.7", transform: "translate(-20px, 15px) scale(1.05)" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-12" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "blob-pulse": "blob-pulse 12s ease-in-out infinite",
        "blob-pulse-alt": "blob-pulse-alt 15s ease-in-out infinite",
        "dash-flow": "dash-flow 1s linear infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backdropBlur: {
        "glass": "12px",
      },
    },
  },
  plugins: [],
};

export default config;
