import Head from 'next/head';
import Image from 'next/image'; // Importar next/image
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css'; // Escolha um tema do PrismJS
// Importar linguagens específicas que você usará com frequência
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
// ... outras linguagens

import { getPostBySlug, getPosts } from '@/lib/api';
import { useEffect } from 'react';

// Função para obter a URL da imagem de capa do Strapi (pode ser movida para um helper se usada em mais lugares)
const getStrapiMedia = (media) => {
  if (!media || !media.data) return null;
  const { url } = media.data.attributes;
  return url.startsWith('/') ? `http://localhost:1337${url}` : url;
};

export default function PostPage({ post }) {
  const router = useRouter();

  useEffect(() => {
    if (post) {
      Prism.highlightAll();
    }
  }, [post, router.asPath]); // Re-executar quando o post ou a rota mudar

  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8 text-center">Carregando post...</div>;
  }

  if (!post) {
    return <div className="container mx-auto px-4 py-8 text-center">Post não encontrado.</div>;
  }

  const { titulo, conteudo, imagem_capa, data_publicacao, autor, categorias, tags } = post.attributes;
  const imageUrl = getStrapiMedia(imagem_capa);
  const formattedDate = new Date(data_publicacao).toLocaleDateString('pt-BR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const imageAttributes = imagem_capa?.data?.attributes;

  return (
    <>
      <Head>
        <title>{titulo} | Blog Dev</title>
        <meta name="description" content={post.attributes.resumo || post.attributes.conteudo?.substring(0,150) || titulo} /> {/* Adicionar resumo se existir, ou um trecho do conteúdo */}
        {/* Open Graph Tags */}
        <meta property="og:title" content={titulo} />
        <meta property="og:description" content={post.attributes.resumo || post.attributes.conteudo?.substring(0,150) || titulo} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:type" content="article" />
        {/* <meta property="og:url" content={`URL_DO_SEU_BLOG/posts/${slug}`} /> */} {/* Adicionar URL base */}
        {/* Twitter Card Tags */}
        {/* <meta name="twitter:card" content="summary_large_image" /> */}
        {/* ... etc ... */}
      </Head>

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{titulo}</h1>
          <div className="text-gray-600 text-sm mb-4">
            <span>Publicado em {formattedDate}</span>
            {autor && autor.data && (
              <span> por {autor.data.attributes.username}</span>
            )}
          </div>
          {imageUrl && imageAttributes && (
            <div className="relative w-full h-auto rounded-lg overflow-hidden mb-8" style={{ maxHeight: '400px', aspectRatio: imageAttributes.width && imageAttributes.height ? `${imageAttributes.width}/${imageAttributes.height}` : '16/9' }}>
              <Image
                src={imageUrl}
                alt={imageAttributes.alternativeText || `Imagem de capa para ${titulo}`}
                layout="fill"
                objectFit="cover"
                priority // Imagem de capa do post é candidata a LCP
              />
            </div>
          )}
        </header>

        <div className="prose lg:prose-xl max-w-none markdown-content">
          <ReactMarkdown
            components={{
              // Mapeia h1 para h2, h2 para h3, etc., para melhor semântica dentro do artigo
              h1: 'h2',
              h2: 'h3',
              // Você pode customizar outros componentes aqui se necessário
              // Ex: para imagens, links, etc.
            }}
          >
            {conteudo}
          </ReactMarkdown>
        </div>

        <footer className="mt-12 pt-8 border-t">
          {/* Informações de categorias e tags */}
          {/* ... (similar ao PostCard) ... */}
        </footer>
      </article>
    </>
  );
}

export async function getStaticPaths() {
  const posts = await getPosts(); // Busca todos os posts para gerar os paths
  const paths = posts.map(post => ({
    params: { slug: post.attributes.slug },
  }));

  return {
    paths,
    fallback: true, // Permite que novas páginas sejam geradas no servidor (ISR)
  };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      notFound: true, // Retorna 404 se o post não for encontrado
    };
  }

  return {
    props: {
      post,
    },
    revalidate: 60, // Revalida a cada 60 segundos
  };
}
