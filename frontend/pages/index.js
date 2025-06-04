import Head from 'next/head';
import PostCard from '@/components/PostCard';
import { getPosts } from '@/lib/api';

export default function HomePage({ posts }) {
  return (
    <>
      <Head>
        <title>Blog de Desenvolvimento | Artigos Técnicos</title>
        <meta name="description" content="Explore artigos técnicos aprofundados sobre programação, desenvolvimento web, backend, frontend e muito mais. Mantenha-se atualizado com as últimas tendências e melhores práticas." />
        <meta property="og:title" content="Blog de Desenvolvimento | Artigos Técnicos" />
        <meta property="og:description" content="Explore artigos técnicos aprofundados sobre programação, desenvolvimento web, backend, frontend e muito mais." />
        {/* <meta property="og:image" content="URL_DE_UMA_IMAGEM_PADRAO_DO_BLOG" /> */}
        {/* <meta property="og:url" content="URL_DO_SEU_BLOG" /> */}
      </Head>

      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold">Bem-vindo ao Meu Blog</h1>
          <p className="text-xl text-gray-600 mt-2">Seu hub de conhecimento em desenvolvimento.</p>
        </header>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhum post encontrado.</p>
        )}

        {/* Adicionar barra de navegação e rodapé posteriormente */}
      </div>
    </>
  );
}

export async function getStaticProps() {
  // Busca os posts no momento da build (SSG)
  const posts = await getPosts(); // Você pode passar 'pt-BR' ou outra localidade se i18n estiver configurado

  return {
    props: {
      posts: posts || [], // Garante que posts seja sempre um array
    },
    revalidate: 60, // Revalida a página a cada 60 segundos (Incremental Static Regeneration)
  };
}
