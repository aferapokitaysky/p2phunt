import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        line: "var(--line)",
        glass: "var(--glass)",
        glassStrong: "var(--glass-strong)",
        glassBorder: "var(--glass-border)",
        glassHi: "var(--glass-hi)",
        brand: "var(--brand)",
        brandMuted: "var(--brand-muted)",
        flamingo: "var(--flamingo)",
        accent: "var(--accent)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        success: "var(--success)",
        info: "var(--info)"
      },
      boxShadow: {
        glass: "var(--shadow-glass)",
        glassLg: "var(--shadow-glass-lg)"
      },
      backdropBlur: {
        xs: "2px"
      },
      borderRadius: {
        "2xl": "1.1rem",
        "3xl": "1.6rem"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      keyframes: {
        drift1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.55" },
          "25%": { transform: "translate(18%, 22%) scale(1.25)", opacity: "0.85" },
          "50%": { transform: "translate(8%, 40%) scale(0.85)", opacity: "0.5" },
          "75%": { transform: "translate(-14%, 16%) scale(1.1)", opacity: "0.75" }
        },
        drift2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.5" },
          "30%": { transform: "translate(-22%, 14%) scale(0.8)", opacity: "0.7" },
          "60%": { transform: "translate(-10%, -24%) scale(1.2)", opacity: "0.85" },
          "85%": { transform: "translate(14%, -8%) scale(1)", opacity: "0.6" }
        },
        drift3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.45" },
          "35%": { transform: "translate(20%, -18%) scale(1.2)", opacity: "0.8" },
          "65%": { transform: "translate(-16%, -10%) scale(0.85)", opacity: "0.55" }
        },
        drift4: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.4" },
          "40%": { transform: "translate(-18%, -20%) scale(1.15)", opacity: "0.7" },
          "70%": { transform: "translate(16%, 12%) scale(0.9)", opacity: "0.5" }
        }
      },
      animation: {
        drift1: "drift1 20s ease-in-out infinite",
        drift2: "drift2 26s ease-in-out infinite",
        drift3: "drift3 17s ease-in-out infinite",
        drift4: "drift4 23s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
