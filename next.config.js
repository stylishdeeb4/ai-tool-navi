/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  async redirects() {
    return [
      { source: '/blog/chatgpt-fukugyo-2025-guide', destination: '/blog/chatgpt-fukugyo-hajimekata', permanent: true },
      { source: '/blog/chatgpt-tsukaikata-beginner', destination: '/blog/chatgpt-tsukaikata-kanzen-guide', permanent: true },
      { source: '/blog/claude-vs-chatgpt-hikaku', destination: '/blog/claude-vs-chatgpt-hikaku-2025', permanent: true },
      { source: '/posts/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
    ]
  }
}

module.exports = nextConfig
