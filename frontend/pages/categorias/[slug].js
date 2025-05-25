import Head from 'next/head';
import { useRouter } from 'next/router';
import PostCard from '@/components/PostCard';
import { getCategories, getCategoryBySlug } from '@/lib/api';

export default function CategoryPage({ category }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div className="container mx-auto px-4 py-8 text-center">Carregando categoria...</div>;
  }

  if (!category) {
    return <div className="container mx-auto px-4 py-8 text-center">Categoria não encontrada.</div>;
  }

  const posts = category.attributes.posts?.data || [];

  if (!category) return <div className="container mx-auto px-4 py-8 text-center">Categoria não encontrada.</div>;
  const categoryName = category.attributes.nome;
  return (
    <>
      <Head>
        <title>Posts em {categoryName} | Blog Dev</title>
        <meta name="description" content={`Explore todos os posts na categoria ${categoryName}.`} />
        <meta property="og:title" content={`Posts em ${categoryName} | Blog Dev`} />
        <meta property="og:description" content={`Explore todos os posts na categoria ${categoryName}.`} />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold">Categoria: {category.attributes.nome}</h1>
        </header>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhum post encontrado nesta categoria.</p>
        )}
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const categories = await getCategories();
  const paths = categories.map(cat => ({
    params: { slug: cat.attributes.slug },
  }));
  return { paths, fallback: true };
}

export async function getStaticProps({ params }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    return { notFound: true };
  }
  return { props: { category }, revalidate: 60 };
}
