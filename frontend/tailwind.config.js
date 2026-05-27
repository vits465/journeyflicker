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
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',

        // Surfaces
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-container': 'var(--surface-container)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container-lowest': 'var(--surface-container-lowest)',

        // Text
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',

        // Borders
        'outline-variant': 'var(--outline-variant)',
      },
    },
  },
  // We use standard tailwind for dark mode, but we'll add explicit overrides in components
  plugins: [],
}
