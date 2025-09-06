import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  
  try {
    // Get all wallpapers (paginated for performance)
    const { data: wallpapers } = await supabase
      .from('wallpapers')
      .select('id, slug, title, updated_at, created_at, category, image_url')
      .order('created_at', { ascending: false })
      .limit(10000) // Limit for XML size
    
    if (!wallpapers) {
      return new NextResponse('No wallpapers found', { status: 404 })
    }
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${wallpapers.map(wallpaper => {
  const url = `${baseUrl}/wallpaper/${wallpaper.slug || wallpaper.id}`
  const lastmod = new Date(wallpaper.updated_at || wallpaper.created_at).toISOString()
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <image:image>
      <image:loc>${wallpaper.image_url || `${baseUrl}/api/wallpapers/${wallpaper.id}/image`}</image:loc>
      <image:title>${wallpaper.title}</image:title>
      <image:caption>${wallpaper.title} - ${wallpaper.category} wallpaper for mobile devices</image:caption>
    </image:image>
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
    console.error('Error generating wallpapers sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}