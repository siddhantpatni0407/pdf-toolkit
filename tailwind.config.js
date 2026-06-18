/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dynamic brand accent via CSS variables
        brand: {
          50:  "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
      },
      backgroundColor: {
        app:         "var(--bg-app)",
        "app-alt":   "var(--bg-app-alt)",
        card:        "var(--bg-card)",
        "card-hover":"var(--bg-card-hover)",
        "sidebar-bg":"var(--bg-sidebar)",
        input:       "var(--bg-input)",
        overlay:     "var(--bg-overlay)",
      },
      borderColor: {
        DEFAULT:         "var(--border-default)",
        "sidebar-border":"var(--border-sidebar)",
        input:           "var(--border-input)",
        focus:           "var(--border-focus)",
      },
      textColor: {
        primary:   "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted:     "var(--text-muted)",
        inverse:   "var(--text-inverse)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-in-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "slide-right":"slideRight 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn:     { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:    { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideRight: { "0%": { transform: "translateX(-10px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};
