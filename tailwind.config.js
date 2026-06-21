/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A6C6B',
        accent: '#00C4A0',
      }
    },
  },
  plugins: [],
}
