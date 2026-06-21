/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#121216', // Deep Charcoal Backdrop
        champagne: '#E2E8F0', // Platinum Silver Accent
        ivory: '#F8FAFC', // Slate White Card Surface
        'slate-dark': '#1E293B', // Deep Charcoal Card Text
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      scale: {
        '103': '1.03',
      },
    },
  },
  plugins: [],
}
