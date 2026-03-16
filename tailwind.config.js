/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        kaus: {
          black: '#0A0A0A',
          white: '#F9F9F7',
          green: '#1D9E75',
          blue: '#185FA5',
          amber: '#BA7517',
          red: '#E24B4A',
        }
      }
    },
  },
  plugins: [],
}
