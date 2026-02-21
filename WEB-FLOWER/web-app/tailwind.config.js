/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101010',
        rose: '#e94b86',
        line: '#f0d7e3',
        soft: '#fff6fa'
      }
    }
  },
  plugins: []
};
