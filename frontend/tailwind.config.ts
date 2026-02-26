import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#030509",
        "surface-raised": "#0a0d14",
        "surface-overlay": "rgba(20, 24, 39, 0.6)",
        "border-subtle": "rgba(42, 47, 62, 0.5)",
        "cyber-red": "#ff003c",
        "cyber-cyan": "#00f0ff",
        "cyber-gold": "#ffb800",
        "cyber-violet": "#b800ff",
        "glow-red": "rgba(255, 0, 60, 0.2)",
        "glow-cyan": "rgba(0, 240, 255, 0.2)",
      },
      boxShadow: {
        "neon-red": "0 0 10px rgba(255, 0, 60, 0.6), 0 0 30px rgba(255, 0, 60, 0.2)",
        "neon-cyan": "0 0 10px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.2)",
        "glass": "0 4px 30px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%)",
      },
      backdropBlur: {
        "glass": "12px",
      },
      keyframes: {
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        }
      },
      animation: {
        "slide-in-right": "slide-in-from-right 0.2s ease-out",
        "radar-sweep": "radar-sweep 4s linear infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
