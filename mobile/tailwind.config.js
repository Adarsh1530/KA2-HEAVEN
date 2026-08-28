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
        },
        heavenLight: {
          bg: '#FAF7FA',
          bgSecondary: '#F2EDF4',
          surface: '#FFFFFF',
          surfaceGlass: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(155, 92, 255, 0.12)',
          rose: '#E03369',
          violet: '#813FE3',
          text: '#151520',
          textSecondary: '#66667C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #9B5CFF 0%, #FF4F81 50%, #FF91B5 100%)',
        'bubble-outgoing': 'linear-gradient(135deg, rgba(155,92,255,0.85) 0%, rgba(255,79,129,0.85) 100%)',
        'glow-radial': 'radial-gradient(circle, rgba(255,79,129,0.25) 0%, rgba(155,92,255,0.15) 50%, transparent 70%)',
      },
      boxShadow: {
        'glow-pink': '0 0 25px -5px rgba(255, 79, 129, 0.4)',
        'glow-violet': '0 0 25px -5px rgba(155, 92, 255, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
