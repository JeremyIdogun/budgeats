import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1E2D4E",
          muted: "#6B7A99",
        },
        coral: {
          DEFAULT: "#E8693A",
          light: "#F5A07A",
        },
        teal: {
          DEFAULT: "#3DBFB8",
          light: "#C2EFEC",
        },
        cream: {
          DEFAULT: "#F7F5F2",
          dark: "#EDEBE7",
        },
        danger: "#D94F4F",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 24px rgba(30,45,78,0.08)",
        "card-hover": "0 8px 32px rgba(30,45,78,0.14)",
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        popIn: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both",
      },
    },
  },
  plugins: [],
};

export default config;
