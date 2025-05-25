import Link from 'next/link';
import Image from 'next/image'; // Importar next/image

// Função para obter a URL da imagem de capa do Strapi
const getStrapiMedia = (media) => {
  if (!media || !media.data) {
    return null; // Ou uma imagem placeholder
  }
  const { url } = media.data.attributes;
  // Assumindo que a URL do Strapi não inclui o hostname se for local
  // e que o Strapi está servindo na porta 1337.
  // Em produção, a URL pode ser absoluta.
  return url.startsWith('/') ? `http://localhost:1337${url}` : url;
};

export default function PostCard({ post }) {
  if (!post || !post.attributes) {
    return null; // Lida com o caso de post indefinido ou malformado
  }

  const { titulo, slug, resumo, imagem_capa, data_publicacao, categorias, tags, autor } = post.attributes;
  const imageUrl = getStrapiMedia(imagem_capa);
  const imageAttributes = imagem_capa?.data?.attributes;

  // Formatar data (exemplo simples)
  const formattedDate = new Date(data_publicacao).toLocaleDateString('pt-BR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {imageUrl && imageAttributes && (
        <Link href={`/posts/${slug}`} passHref legacyBehavior>
          <a className="block relative w-full h-48"> {/* Container para o Image */}
            <Image
              src={imageUrl}
              alt={imageAttributes.alternativeText || titulo || 'Imagem do post'}
              layout="fill" // Faz a imagem preencher o container
              objectFit="cover" // Equivalente a object-cover do Tailwind
              priority={false} // Defina como true para imagens LCP (Largest Contentful Paint) na primeira dobra
            />
          </a>
        </Link>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">
          <Link href={`/posts/${slug}`} className="hover:text-blue-600 transition-colors">
            {titulo || 'Título Indisponível'}
          </Link>
        </h2>
        {/* O campo 'resumo' não foi definido no modelo Strapi,
            poderia ser parte do 'conteudo' ou um campo separado.
            Por agora, vamos omitir ou usar um trecho do conteúdo se disponível.
        // <p className="text-gray-700 mb-4">{resumo || 'Sem resumo disponível.'}</p>
        */}
        <div className="text-sm text-gray-500 mb-2">
          <span>{formattedDate}</span>
          {autor && autor.data && (
            <span> • Por {autor.data.attributes.username}</span>
          )}
        </div>
        <div className="mb-4">
          {categorias && categorias.data && categorias.data.map(cat => (
            <Link key={cat.id} href={`/categorias/${cat.attributes.slug}`}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-2 py-1 mr-2 mb-2 inline-block">
              {cat.attributes.nome}
            </Link>
          ))}
        </div>
        {/* Adicionar tags de forma similar se desejar */}
      </div>
    </div>
  );
}
