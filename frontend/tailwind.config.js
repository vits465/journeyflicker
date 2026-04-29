/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        body:  ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        // Brand / interactive
        primary:        '#1a1a1a',
        'on-primary':   '#ffffff',

        // Surfaces
        background:                  '#fafaf9',
        surface:                     '#ffffff',
        'surface-container':         '#f5f5f4',
        'surface-container-low':     '#f0efed',
        'surface-container-lowest':  '#fafaf9',

        // Text
        'on-surface':         '#1c1b1a',
        'on-surface-variant': '#6b6860',

        // Borders
        'outline-variant': '#cac7c0',
      },
    },
  },
  plugins: [],
}
