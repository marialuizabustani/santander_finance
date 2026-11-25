/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta primária do guia de marca Santander ("Basic guidelines", 2. Color palette).
        // Fundos permitidos pelo guia: branco, Lisbon (claro), Rio (suave) e Santander Red.
        marca: {
          DEFAULT: '#EC0000', // Santander Red
          escuro: '#CC0000', // Boston
          profundo: '#990000', // London
          madrid: '#EA6F5D', // Madrid
          mexico: '#F0B998', // Mexico City
          suave: '#F5DECF', // Rio
          claro: '#FBF1EA', // Lisbon
        },
        tinta: { DEFAULT: '#222222', suave: '#5F5F5F', linha: '#E8D5C8', fundo: '#FBF1EA' },
        // Cor funcional apenas para confirmação ("cabe no orçamento"), usada com parcimônia
        ok: { DEFAULT: '#1D6B35', fundo: '#E9F5EC' },
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      fontSize: { base: ['17px', '1.55'] },
      boxShadow: { cartao: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)' },
    },
  },
  plugins: [],
};
