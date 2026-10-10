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
        gold: {
          50: '#FDFBF7',
          100: '#F9F5EC',
          200: '#F2E8D3',
          300: '#E7D5B0',
          400: '#DABF86',
          500: '#C9A85C',
          600: '#B89343',
          700: '#94722D',
          800: '#755823',
          900: '#5A431A',
        },
        rosewood: {
          500: '#E06D7F',
          600: '#C94E62',
        },
        dark: {
          900: '#0B0F17',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
          500: '#4B5563',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(135deg, #0B0F17 0%, #161E2E 50%, #0B0F17 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F2E8D3 0%, #C9A85C 50%, #94722D 100%)',
      }
    },
  },
  plugins: [],
};
