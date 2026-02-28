/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        accent: '#E94560',
        bg: '#0D0D0D',
        surface: '#1A1A2E',
        card: '#16213E',
        muted: '#2A2A4A',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      }
    }
  },
  plugins: []
}
