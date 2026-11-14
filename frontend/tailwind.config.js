/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luna: {
          950: '#06080D',
          900: '#0B0F19',
          850: '#111726',
          800: '#161F33',
          700: '#222E4A',
          600: '#324268',
          500: '#475C8D',
          400: '#6981B8',
          300: '#94A6D2',
          200: '#C2CEEB',
          100: '#E4EBFA',
          50: '#F4F7FD',
        },
        solar: {
          amber: '#F59E0B',
          glow: '#FBBF24',
          dark: '#B45309'
        },
        earth: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          glow: '#67E8F9'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
