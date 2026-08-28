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
        heaven: {
          bg: '#07070C',
          bgSecondary: '#101019',
          surface: '#171722',
          surfaceGlass: 'rgba(23, 23, 34, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          rose: '#FF4F81',
          violet: '#9B5CFF',
          softPink: '#FF91B5',
          softViolet: '#B28CFF',
          text: '#FFFFFF',
          textSecondary: '#A7A7B7',
          success: '#42D392',
          error: '#FF5570',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-pink': '0 0 25px -5px rgba(255, 79, 129, 0.4)',
        'glow-violet': '0 0 25px -5px rgba(155, 92, 255, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
