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
        card: "0 1px 3px rgba(0,0,0,0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
