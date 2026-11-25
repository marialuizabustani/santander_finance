/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: { DEFAULT: '#EC0000', escuro: '#CC0000', profundo: '#990000', claro: '#FBF1EA', suave: '#F5DECF' },
        tinta: { DEFAULT: '#222222', suave: '#5F5F5F', linha: '#E6E6E6', fundo: '#F6F6F6' },
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      fontSize: { base: ['17px', '1.55'] },
      boxShadow: { cartao: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)' },
    },
  },
  plugins: [],
};
