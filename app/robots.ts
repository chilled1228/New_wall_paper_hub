import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/wallpaper/',
          '/categories/',
          '/blog/',
          '/search',
          '/popular',
          '/latest',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/private/',
          '/login',
          '/temp/',
          '/*.json$',
          '/search?*', // Disallow search query parameters
        ],
        crawlDelay: 1, // 1 second delay between requests
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/private/',
          '/login',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/private/',
          '/login',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      {
        userAgent: 'WhatsApp',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      // Block aggressive crawlers
      {
        userAgent: [
          'CCBot',
          'ChatGPT-User',
          'GPTBot',
          'Google-Extended',
          'anthropic-ai',
          'PerplexityBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-wallpapers.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-blog.xml`,
    ],
    host: baseUrl,
  }
}