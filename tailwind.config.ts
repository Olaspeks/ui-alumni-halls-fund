import type { Config } from "tailwindcss";

// Institutional palette: a sharp, near-navy indigo paired with a hard
// (not pastel) gold. Deliberately avoids the generic
// purple-to-blue-gradient "AI product" look — flat fields, hairline
// borders, one accent color used sparingly.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          950: "#080B24",
          900: "#0E1338",
          800: "#161C52",
          700: "#202972",
          600: "#2B3690",
          500: "#3B47AD",
          400: "#5C68C4",
          300: "#8B93D8",
          200: "#C2C7EB",
          100: "#E4E6F7",
          50: "#F4F5FC",
        },
        gold: {
          900: "#4A3607",
          800: "#6B4F0C",
          700: "#8C6813",
          600: "#A9821D",
          500: "#C79A2B",
          400: "#D9AE45",
          300: "#E6C877",
          200: "#F0DEA9",
          100: "#F8EFD6",
          50: "#FCF8EC",
        },
        ink: {
          900: "#0A0C14",
          700: "#2B2E3D",
          500: "#5B5F72",
          300: "#9BA0B4",
          100: "#E7E9F1",
        },
      },
      // System font stacks, not next/font/google — deliberately. next/font
      // fetches webfont files from fonts.gstatic.com at build time, and
      // that host is unreachable on some networks (this project's own dev
      // sandbox included: TCP connects fine, but the TLS handshake is
      // reset every time — a filtered-network signature, not flakiness).
      // A build that only works with unrestricted internet access is a
      // liability. These stacks land close to the original design intent
      // (an editorial serif / a clean grotesque sans / a monospace for
      // currency figures) using each OS's best-available equivalent, with
      // zero network dependency.
      //
      // To use real webfonts instead (e.g. Fraunces/Manrope/IBM Plex
      // Mono) on a network that can reach Google Fonts: load them via
      // next/font/google in app/layout.tsx as CSS variables, then swap
      // the literal stacks below for `["var(--font-serif)", ...fallback]`
      // etc. — everything else (every `font-serif`/`font-sans`/`font-mono`
      // class in the app) stays the same.
      fontFamily: {
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'ui-serif', 'serif'],
        sans: ['-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'ui-sans-serif', 'sans-serif'],
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8, 11, 36, 0.06), 0 1px 1px rgba(8, 11, 36, 0.04)",
        raised: "0 4px 16px rgba(8, 11, 36, 0.10)",
      },
      borderRadius: {
        sharp: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
