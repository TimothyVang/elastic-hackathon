import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#0f1117",
        "surface-raised": "#161a23",
        "surface-overlay": "#1c2030",
        "border-subtle": "#2a2f3e",
      },
      keyframes: {
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-from-right 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
