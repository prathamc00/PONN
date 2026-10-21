/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CRISMATECH Default Brand Theme (Forest & Ochre)
        primary: '#07241a', // Deep Forest Green
        'primary-container': '#1e3a2f', // Forest Green
        'on-primary': '#ffffff',
        'on-primary-container': '#caeada',
        'primary-fixed': '#caeada',
        'primary-fixed-dim': '#aecebe',

        secondary: '#9d4225', // Ochre / Terracotta
        'secondary-container': '#c25e3e',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#ffdbd0',

        accent: '#059669', // Emerald
        'accent-container': '#10b981',
        'on-accent': '#ffffff',

        background: '#f8fafc',
        surface: '#ffffff',
        'on-surface': '#07241a',
        'on-surface-variant': '#424844',

        'surface-dim': '#f1f5f9',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#ffffff',
        'surface-container': '#f4ece8',
        'surface-container-high': '#e9e1dd',
        'surface-container-highest': '#cbd5e1',
        'surface-variant': '#f8fafc',

        'on-background': '#07241a',
        outline: '#727974',
        'outline-variant': '#e2e8f0',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        headline: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
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
