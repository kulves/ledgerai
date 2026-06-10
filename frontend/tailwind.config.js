/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0C2340',
        },
        gold: {
          500: '#C9962C',
        }
      }
    },
  },
  plugins: [],
}