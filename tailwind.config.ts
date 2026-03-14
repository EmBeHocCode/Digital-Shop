import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF7FA9",
        secondary: "#6C8CFF",
        accent: "#FFD166",
        background: "#F7F9FC",
        surface: "#FFFFFF",
        ink: "#1F2937",
        muted: "#6B7280",
        border: "#E5E7EB",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(108, 140, 255, 0.14)",
        card: "0 14px 32px rgba(36, 49, 77, 0.08)",
        premium: "0 18px 44px rgba(31, 41, 55, 0.10)",
        glow: "0 0 0 1px rgba(255,127,169,0.08), 0 24px 70px rgba(255,127,169,0.18)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at top left, rgba(255,127,169,0.30), transparent 36%), radial-gradient(circle at top right, rgba(108,140,255,0.28), transparent 34%), linear-gradient(135deg, #ffffff 0%, #f7f9fc 100%)",
        "soft-mesh":
          "radial-gradient(circle at 15% 15%, rgba(255,127,169,0.18), transparent 26%), radial-gradient(circle at 85% 15%, rgba(108,140,255,0.16), transparent 28%), radial-gradient(circle at 50% 80%, rgba(255,209,102,0.14), transparent 34%), linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        glow: {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        glow: "glow 8s ease-in-out infinite",
        "gradient-shift": "gradientShift 10s ease infinite"
      }
    }
  },
  plugins: []
};

export default config;
