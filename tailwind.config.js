/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#003178",
          800: "#0D47A1",
          100: "#CFE6F2"
        },
        canvas: {
          50: "#F6FAFE"
        },
        surface: {
          100: "#F0F4F8"
        },
        ink: {
          900: "#171C1F",
          700: "#434652",
          500: "#4C616C"
        },
        border: {
          200: "#D7DEE7",
          100: "#EEF3F8"
        },
        success: {
          700: "#1C7C54"
        },
        warning: {
          700: "#B7791F"
        },
        danger: {
          700: "#BA1A1A"
        }
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "24px",
        pill: "999px"
      },
      boxShadow: {
        card: "0 3px 6px rgba(14, 22, 26, 0.07)",
        floating: "0 10px 18px rgba(0, 49, 120, 0.12)"
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        14: "56px",
        16: "64px",
        24: "96px",
        32: "128px"
      }
    }
  },
  plugins: []
};
