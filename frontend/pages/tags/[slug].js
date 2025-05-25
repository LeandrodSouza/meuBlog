import Head from 'next/head';
import { useRouter } from 'next/router';
import PostCard from '@/components/PostCard';
import { getTags, getTagBySlug } from '@/lib/api'; // getTagBySlug precisa ser criada em api.js

export default function TagPage({ tag }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8 text-center">Carregando tag...</div>;
  }

  if (!tag) {
    return <div className="container mx-auto px-4 py-8 text-center">Tag não encontrada.</div>;
  }
  
  const posts = tag.attributes.posts?.data || [];

  if (!tag) return <div className="container mx-auto px-4 py-8 text-center">Tag não encontrada.</div>;
  const tagName = tag.attributes.nome;
  return (
    <>
      <Head>
        <title>Posts com a tag {tagName} | Blog Dev</title>
        <meta name="description" content={`Explore todos os posts marcados com a tag ${tagName}.`} />
        <meta property="og:title" content={`Posts com a tag ${tagName} | Blog Dev`} />
        <meta property="og:description" content={`Explore todos os posts marcados com a tag ${tagName}.`} />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold">Tag: {tag.attributes.nome}</h1>
        </header>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhum post encontrado com esta tag.</p>
        )}
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const tags = await getTags(); // getTags precisa ser criada em api.js
  const paths = tags.map(t => ({
    params: { slug: t.attributes.slug },
  }));
  return { paths, fallback: true };
}

export async function getStaticProps({ params }) {
  const tag = await getTagBySlug(params.slug);
  if (!tag) {
    return { notFound: true };
  }
  return { props: { tag }, revalidate: 60 };
}
