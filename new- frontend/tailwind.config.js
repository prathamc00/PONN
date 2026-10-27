/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CRISMATECH Brand Theme (Dark Forest/Slate with Signature Orange Accents)
        primary: '#07241a', // Deep Forest / Charcoal
        'primary-container': '#1e3a2f', // Forest Green
        'on-primary': '#ffffff',
        'on-primary-container': '#caeada',
        'primary-fixed': '#ffedd5',
        'primary-fixed-dim': '#fed7aa',

        secondary: '#ea580c', // Crismatech Brand Orange
        'secondary-container': '#c2410c',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#ffedd5',

        accent: '#f97316', // Orange Accent
        'accent-container': '#ea580c',
        'on-accent': '#ffffff',

        background: '#f8fafc',
        surface: '#ffffff',
        'on-surface': '#0f172a',
        'on-surface-variant': '#475569',

        'surface-dim': '#f1f5f9',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#ffffff',
        'surface-container': '#f1f5f9',
        'surface-container-high': '#e2e8f0',
        'surface-container-highest': '#cbd5e1',
        'surface-variant': '#f8fafc',

        'on-background': '#0f172a',
        outline: '#727974',
        'outline-variant': '#e2e8f0',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        headline: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
