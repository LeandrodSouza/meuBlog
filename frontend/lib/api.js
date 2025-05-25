// URL base da sua API Strapi
// Certifique-se de que o Strapi está rodando e acessível nesta URL
// Em desenvolvimento, com Strapi rodando na porta 1337:
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337/api";

/**
 * Busca todos os posts da API do Strapi.
 * @param {string} locale - O locale para buscar (opcional).
 * @returns {Promise<Array>} Uma promessa que resolve para um array de posts.
 */
export async function getPosts(locale) {
  const params = new URLSearchParams();
  if (locale) {
    params.append('locale', locale);
  }
  // Adiciona 'populate' para buscar campos de relação como categorias, tags, imagem_capa, autor.
  // Ajuste os campos populados conforme necessário.
  params.append('populate', 'imagem_capa,categorias,tags,autor');

  const response = await fetch(`${STRAPI_API_URL}/posts?${params.toString()}`);
  if (!response.ok) {
    console.error("Failed to fetch posts:", response.statusText);
    // Considerar lançar um erro ou retornar um array vazio/null
    // para que a página possa lidar com o erro de forma graciosa.
    return [];
  }
  const data = await response.json();
  return data.data; // A API do Strapi v4 retorna os dados dentro de um objeto "data"
}

// Você pode adicionar mais funções aqui para buscar categorias, tags, post individual, etc.
// Exemplo:
// export async function getCategories() { ... }
// export async function getPostBySlug(slug) { ... }

/**
 * Busca um post específico pelo slug.
 * @param {string} slug - O slug do post.
 * @returns {Promise<Object|null>} O objeto do post ou null se não encontrado.
 */
export async function getPostBySlug(slug) {
  const params = new URLSearchParams();
  params.append('populate', 'imagem_capa,categorias,tags,autor,conteudo'); // Garanta que o conteúdo e outras relações sejam populados
  // Filtra pelo slug. No Strapi v4, os filtros são aninhados.
  params.append('filters[slug][$eq]', slug);

  const response = await fetch(`${STRAPI_API_URL}/posts?${params.toString()}`);
  if (!response.ok) {
    console.error(`Failed to fetch post by slug ${slug}:`, response.statusText);
    return null;
  }
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0]; // Retorna o primeiro post encontrado (deve ser único pelo slug)
  }
  return null;
}

/**
 * Busca todas as categorias.
 * @returns {Promise<Array>} Um array de categorias.
 */
export async function getCategories() {
  const response = await fetch(`${STRAPI_API_URL}/categorias`);
  if (!response.ok) {
    console.error("Failed to fetch categories:", response.statusText);
    return [];
  }
  const data = await response.json();
  return data.data;
}

/**
 * Busca uma categoria específica pelo slug, incluindo seus posts.
 * @param {string} slug - O slug da categoria.
 * @returns {Promise<Object|null>} A categoria com seus posts ou null.
 */
export async function getCategoryBySlug(slug) {
  const params = new URLSearchParams();
  // Popula os posts relacionados com a categoria e os campos dos posts
  params.append('populate[posts][populate]', 'imagem_capa,categorias,tags,autor');
  params.append('filters[slug][$eq]', slug);

  const response = await fetch(`${STRAPI_API_URL}/categorias?${params.toString()}`);
  if (!response.ok) {
    console.error(`Failed to fetch category by slug ${slug}:`, response.statusText);
    return null;
  }
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }
  return null;
}

/**
 * Busca todas as tags.
 * @returns {Promise<Array>} Um array de tags.
 */
export async function getTags() {
  const response = await fetch(`${STRAPI_API_URL}/tags`);
  if (!response.ok) {
    console.error("Failed to fetch tags:", response.statusText);
    return [];
  }
  const data = await response.json();
  return data.data;
}

/**
 * Busca uma tag específica pelo slug, incluindo seus posts.
 * @param {string} slug - O slug da tag.
 * @returns {Promise<Object|null>} A tag com seus posts ou null.
 */
export async function getTagBySlug(slug) {
  const params = new URLSearchParams();
  params.append('populate[posts][populate]', 'imagem_capa,categorias,tags,autor');
  params.append('filters[slug][$eq]', slug);

  const response = await fetch(`${STRAPI_API_URL}/tags?${params.toString()}`);
  if (!response.ok) {
    console.error(`Failed to fetch tag by slug ${slug}:`, response.statusText);
    return null;
  }
  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }
  return null;
}

/**
* Busca posts por um termo de pesquisa.
* @param {string} term - O termo a ser buscado.
* @returns {Promise<Array>} Um array de posts que correspondem ao termo.
*/
export async function searchPosts(term) {
 if (!term || term.trim() === '') {
    return [];
 }
 const params = new URLSearchParams();
 // Popula os campos necessários para o PostCard
 params.append('populate', 'imagem_capa,categorias,tags,autor');
 // Filtra por título ou conteúdo (usando $containsi para case-insensitive)
 // O Strapi v4 usa uma sintaxe de filtro OR mais complexa
 params.append('_q', term); // Para busca simples em campos configurados como pesquisáveis no Strapi
 // Alternativamente, para filtros OR mais explícitos (requer configuração de API ou customização):
 // params.append('filters[$or][0][titulo][$containsi]', term);
 // params.append('filters[$or][1][conteudo][$containsi]', term);

 const response = await fetch(`${STRAPI_API_URL}/posts?${params.toString()}`);
 if (!response.ok) {
    console.error(`Failed to search posts for term "${term}":`, response.statusText);
    return [];
 }
 const data = await response.json();
 return data.data;
}
