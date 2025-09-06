import { getAllPosts } from '@/lib/blog'
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  
  try {
    // Get all published blog posts
    const posts = await getAllPosts('published')
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts.map(post => {
  const url = `${baseUrl}/blog/${post.slug}`
  const lastmod = new Date(post.updated_at || post.created_at).toISOString()
  const publishDate = new Date(post.published_at || post.created_at).toISOString().split('T')[0]
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <news:news>
      <news:publication>
        <news:name>WallpaperHub Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishDate}</news:publication_date>
      <news:title>${post.title}</news:title>
      <news:keywords>${post.tags?.join(', ') || 'wallpapers, mobile backgrounds'}</news:keywords>
    </news:news>
  </url>`
}).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error generating blog sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}