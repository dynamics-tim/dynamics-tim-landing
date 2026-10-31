import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import defaultTheme from 'tailwindcss/defaultTheme';

/**
 * Design tokens — derived from the pitch video (near-black "ink", signal lime, warm paper).
 *
 * - `ink`     near-black, slightly green-tinted neutrals (backgrounds of dark sections, text)
 * - `paper`   warm off-white surfaces
 * - `lime`    the signal colour; 300–500 on dark, 700–800 for text on light
 * - `ember`   the "problem" red used sparingly (Freitag, 17:58)
 *
 * `brand`, `accent`, `surface`, `signal` and `slate` are remapped onto the same system so
 * existing pages (profile, legal, resources) inherit the new look without template rewrites.
 */
const ink = {
  50: '#F4F5F0',
  100: '#E7E9E2',
  200: '#CDD1C6',
  300: '#A3A99B',
  400: '#787F70',
  500: '#575E51',
  600: '#3F453A',
  700: '#2A2F26',
  800: '#181C15',
  900: '#0E110C',
  950: '#070906',
};

const lime = {
  50: '#F7FCE8',
  100: '#EDF8C8',
  200: '#DDF294',
  300: '#CDEF5F',
  400: '#C3EE3E',
  500: '#B9EC2E',
  600: '#94C21A',
  700: '#5F7E0F',
  800: '#46600B',
  900: '#2E3F08',
};

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}', './public/**/*.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
        heading: ['"Inter"', ...defaultTheme.fontFamily.sans],
        mono: [
          'ui-monospace',
          '"SFMono-Regular"',
          '"Cascadia Mono"',
          '"Segoe UI Mono"',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        ink,
        lime,
        paper: { DEFAULT: '#F4F5F0', 50: '#FAFBF7', 100: '#F4F5F0', 200: '#ECEEE6' },
        ember: { 400: '#FF5A4F', 500: '#FD4136', 600: '#D92D22' },
        // Legacy names, remapped onto the new system
        brand: {
          50: '#F7FCE8',
          100: '#EDF8C8',
          200: '#DDF294',
          300: '#CDEF5F',
          400: '#B9EC2E',
          500: '#46600B',
          600: '#46600B',
          700: '#2E3F08',
          800: '#181C15',
          900: '#0E110C',
        },
        accent: {
          50: '#F7FCE8',
          100: '#EDF8C8',
          200: '#DDF294',
          300: '#CDEF5F',
          400: '#B9EC2E',
          500: '#94C21A',
          600: '#2A2F26',
          700: '#1F2A0E',
          800: '#181C15',
          900: '#0E110C',
        },
        surface: { 50: '#FAFBF7', 100: '#F4F5F0', 200: '#E7E9E2', 300: '#CDD1C6' },
        signal: { 100: '#EDF8C8', 300: '#CDEF5F', 400: '#B9EC2E', 500: '#94C21A', 600: '#5F7E0F' },
        slate: ink,
      },
      letterSpacing: {
        display: '-0.045em',
        tightish: '-0.02em',
      },
      boxShadow: {
        soft: '0 18px 48px rgba(7, 9, 6, 0.10)',
      },
      maxWidth: {
        page: '76rem',
      },
    },
  },
  plugins: [typography, forms],
};

export default config;
