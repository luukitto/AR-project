/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        georgian: ["'BPG Glaho', 'Noto Sans Georgian', 'Arial', 'sans-serif'"]
      },
      colors: {
        primary: '#ffb366',
        accent: '#ff6f3c',
        dark: '#181825',
        card: '#232336',
        muted: '#2d2d44'
      },
      boxShadow: {
        soft: '0 4px 32px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
}
