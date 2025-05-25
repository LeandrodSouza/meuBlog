/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '127.0.0.1'], // Adicione o hostname do seu Strapi aqui
    // Exemplo se o Strapi estivesse em um domínio de produção:
    // domains: ['your-strapi-domain.com'],
  },
}

module.exports = nextConfig
