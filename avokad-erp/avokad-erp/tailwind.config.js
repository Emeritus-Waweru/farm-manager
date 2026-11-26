/** Avokad brand tokens (from avokadfruits.co.ke): green #009a4f, orange #f67b00, black, Inter.
 *  `forest` is the brand green family. Darker steps are used wherever white text sits on green, to meet WCAG AA. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { green: '#009a4f', orange: '#f67b00', black: '#0a0a0a' },
        forest: { 950: '#000000', 900: '#0a0a0a', 800: '#005f2f', 700: '#00753a', 500: '#009a4f', 100: '#d9f2e4', 50: '#eefaf3' },
        surface: { DEFAULT: '#f6f6f4', card: '#ffffff', line: '#e3e3e3' },
        ink: { DEFAULT: '#171717', soft: '#5c5c5c' },
        amber: { 600: '#a85200', 100: '#fde7cc' },
        clay: { 600: '#a8432f', 100: '#f6dcd5' },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
