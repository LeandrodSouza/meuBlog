import { getPosts, getCategories, getTags } from '@/lib/api'; // Supondo que essas funções retornem todos os itens

const BLOG_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; // Defina a URL base do seu site

function generateSiteMap(posts, categories, tags) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <!-- Homepage -->
      <url>
        <loc>${BLOG_URL}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <!-- Posts -->
      ${posts
        .map(({ attributes }) => {
          return `
            <url>
                <loc>${`${BLOG_URL}/posts/${attributes.slug}`}</loc>
                <lastmod>${attributes.updatedAt || attributes.createdAt}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>
          `;
        })
        .join('')}
      <!-- Categories -->
      ${categories
        .map(({ attributes }) => {
          return `
            <url>
                <loc>${`${BLOG_URL}/categorias/${attributes.slug}`}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.7</priority>
            </url>
          `;
        })
        .join('')}
      <!-- Tags -->
      ${tags
        .map(({ attributes }) => {
          return `
            <url>
                <loc>${`${BLOG_URL}/tags/${attributes.slug}`}</loc>
                <changefreq>monthly</changefreq>
                <priority>0.6</priority>
            </url>
          `;
        })
        .join('')}
      {/* Adicionar outras páginas estáticas se houver, como /busca */}
      <url>
         <loc>${BLOG_URL}/busca</loc>
         <changefreq>monthly</changefreq>
         <priority>0.5</priority>
      </url>
    </urlset>
  `;
}

export async function getServerSideProps({ res }) {
  // Buscar todos os posts, categorias e tags
  const posts = await getPosts() || [];
  const categories = await getCategories() || [];
  const tags = await getTags() || [];

  const sitemap = generateSiteMap(posts, categories, tags);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

// Default export to prevent Next.js errors
export default function SiteMapPage() {}
