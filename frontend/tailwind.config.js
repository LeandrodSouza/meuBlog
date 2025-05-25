/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Você pode estender o tema aqui conforme o design do Medium
      // Ex: tipografia, cores
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Exemplo de fonte
      },
    },
  },
  plugins: [],
}
