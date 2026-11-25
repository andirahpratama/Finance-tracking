/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        finance: {
          50: '#f2f8f4',
          100: '#e0efe5',
          200: '#c3dfcd',
          300: '#98c7ab',
          400: '#69a984',
          500: '#4a8c67',
          600: '#397052',
          700: '#2f5a43',
          800: '#284837',
          900: '#223c2f',
          950: '#12211a',
        },
        cream: {
          50: '#fffefb',
          100: '#faf7f0',
          200: '#f3ede0',
        },
        gold: {
          50: '#fefaf0',
          100: '#fcf2d6',
          200: '#f7e1a3',
          300: '#f0ca6b',
          400: '#e6b23e',
          500: '#d49a22',
          600: '#b37a18',
        },
        navy: {
          800: '#0f172a',
          900: '#0a0f1d',
          950: '#050811',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2.5s infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
