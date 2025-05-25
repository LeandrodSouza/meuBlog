import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import PostCard from '@/components/PostCard';
import { searchPosts } from '@/lib/api'; // searchPosts precisa ser criada em api.js

// fetcher para SWR
const fetcher = async (url, term) => {
  if (!term || term.trim() === '') return { data: [] }; // Não busca se o termo for vazio
  // A função searchPosts já lida com a URL completa e a lógica de fetch
  const posts = await searchPosts(term);
  return { data: posts }; // SWR espera um objeto com uma propriedade 'data' ou que a promessa resolva para os dados
};

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(router.query.q || '');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(router.query.q || '');

  // Usar SWR para buscar os dados. A chave inclui o termo de busca para re-fetch automático.
  // A busca só é disparada se submittedSearchTerm não for vazio.
  const { data: searchResults, error } = useSWR(
    submittedSearchTerm ? [`/api/search`, submittedSearchTerm] : null, // Chave SWR
    ([_, term]) => fetcher(null, term), // fetcher adaptado
    { revalidateOnFocus: false } // Opcional: desabilita revalidação no foco da janela
  ); 
  
  const posts = searchResults?.data || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmittedSearchTerm(searchTerm);
    router.push(`/busca?q=${encodeURIComponent(searchTerm)}`, undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>Busca | Blog Dev</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold">Buscar Posts</h1>
          <form onSubmit={handleSearch} className="mt-4 max-w-xl mx-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por palavra-chave..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Buscar
            </button>
          </form>
        </header>

        {error && <p className="text-center text-red-500">Erro ao buscar posts.</p>}
        
        {submittedSearchTerm && !error && !searchResults && (
          <p className="text-center text-gray-500">Buscando...</p>
        )}

        {submittedSearchTerm && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {submittedSearchTerm && posts.length === 0 && !error && searchResults && (
          <p className="text-center text-gray-500">Nenhum post encontrado para "{submittedSearchTerm}".</p>
        )}
      </div>
    </>
  );
}
