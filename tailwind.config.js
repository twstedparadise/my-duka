/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D6A4F',
        secondary: '#52B788',
        accent: '#F4A261',
        danger: '#E76F51',
        background: '#F8F9FA',
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
