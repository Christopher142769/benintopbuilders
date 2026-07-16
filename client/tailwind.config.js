/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#F97316',
          dark: '#E05F04',
          soft: '#FFF3E9',
        },
        bleu: {
          DEFAULT: '#1D50C8',
          soft: '#F2F6FE',
        },
        ink: '#15171C',
        gris: '#62666F',
        fond: {
          DEFAULT: '#FFFFFF',
          doux: '#F8F8F7',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
        card: '24px',
        section: '28px',
        media: '22px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(21,23,28,.08)',
        lift: '0 24px 50px rgba(21,23,28,.10)',
        cta: '0 8px 24px rgba(249,115,22,.28)',
      },
      borderColor: {
        filet: 'rgba(29,80,200,.28)',
        card: 'rgba(21,23,28,.09)',
      },
    },
  },
  plugins: [],
};
