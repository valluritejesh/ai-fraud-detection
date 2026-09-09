/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Emerald & Forest Primary Palette
        emerald: {
          950: "#031F1A",
          900: "#063B32", // Deep Emerald
          850: "#094A3F",
          800: "#0B5D4F", // Forest Green
          700: "#087F6B", // Teal
          600: "#0D967E",
          500: "#10B981", // Emerald
          400: "#34D399",
          300: "#6EE7B7",
          200: "#A7F3D0",
          100: "#DDF8EE", // Soft Mint
          50: "#F0FDF8",
        },
        forest: {
          950: "#031F1A",
          900: "#063B32",
          800: "#0B5D4F",
          700: "#087F6B",
          600: "#0A917B",
        },
        // Gold & Champagne Secondary Palette
        gold: {
          900: "#5E400E",
          800: "#7E5614",
          700: "#9E6C1A",
          600: "#D9A441", // Warm Gold
          500: "#E5B65D",
          400: "#EFCA7F",
          300: "#F7E7B2", // Champagne Gold
          200: "#FBF0CC",
          100: "#FDF7E6",
          50: "#FEFDF8",
        },
        // Warm Ivory & Cream Background Surfaces
        cream: {
          900: "#B8B3A1",
          800: "#CBC6B6",
          700: "#DFDBCC",
          600: "#EAE7DC",
          500: "#F7F5EE", // Warm Cream
          400: "#FAF8F2",
          300: "#FCFAF6",
          200: "#FEFCFA",
          100: "#FFFFFF",
          50: "#FFFFFF",
        },
        // Semantic Risk Colors
        risk: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#E5A11A",
          low: "#10B981",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(6, 59, 50, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(6, 59, 50, 0.16)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        'gold-glow': '0 0 20px rgba(217, 164, 65, 0.25)',
        'emerald-glow': '0 0 25px rgba(16, 185, 129, 0.20)',
        'card-soft': '0 2px 12px -2px rgba(6, 59, 50, 0.05), 0 1px 4px -1px rgba(6, 59, 50, 0.03)',
        'card-elevated': '0 12px 28px -4px rgba(6, 59, 50, 0.08), 0 4px 10px -2px rgba(6, 59, 50, 0.04)',
      }
    },
  },
  plugins: [],
}
