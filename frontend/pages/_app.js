import '@/styles/globals.css' // Importa os estilos globais com Tailwind
import '@/styles/markdown.css'; // Adicionar esta linha

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
