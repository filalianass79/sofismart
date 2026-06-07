import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        navy: {
          50: "#f4f5f7",
          100: "#e8eaef",
          600: "#3d4154",
          800: "#1e2130",
          900: "#161824",
          950: "#0c0d12",
        },
        gold: {
          200: "#f3e6b8",
          300: "#e8d48a",
          400: "#d4af37",
          500: "#b8941f",
          600: "#9a7a18",
        },
        morocco: {
          500: "#c1272d",
          600: "#a61f24",
        },
        cream: {
          50: "#faf9f6",
          100: "#f2efe6",
        },
      },
      backgroundImage: {
        "gold-shine": "linear-gradient(135deg, #e8d48a 0%, #c5a028 45%, #9a7a18 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
