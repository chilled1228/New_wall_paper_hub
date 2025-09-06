import { supabase } from '@/lib/supabase'
import { generateWallpaperSlug } from '@/lib/slug-utils'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  
  try {
    // Get wallpapers with image URLs
    const { data: wallpapers, error } = await supabase
      .from('wallpapers')
      .select('id, title, description, category, tags, image_url, medium_url, large_url, original_url, created_at')
      .order('created_at', { ascending: false })
      .limit(1000) // Google Images sitemap limit
    
    if (error) {
      console.error('Error fetching wallpapers for image sitemap:', error)
      return new Response('Error generating sitemap', { status: 500 })
    }

    const imageEntries = (wallpapers || []).map(wallpaper => {
      const slug = generateWallpaperSlug(wallpaper)
      const pageUrl = `${baseUrl}/wallpaper/${slug}`
      
      // Use medium_url for main image, original_url for download
      const imageUrl = wallpaper.medium_url || wallpaper.image_url
      const fullSizeUrl = wallpaper.original_url || wallpaper.large_url || wallpaper.medium_url || wallpaper.image_url
      
      // Clean description and title for XML
      const cleanTitle = (wallpaper.title || 'Mobile Wallpaper')
        .replace(/[&<>"']/g, (match) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match] || match))
      
      const cleanDescription = (wallpaper.description || `${cleanTitle} - High-quality mobile wallpaper in ${wallpaper.category} category`)
        .replace(/[&<>"']/g, (match) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match] || match))
      
      const tags = Array.isArray(wallpaper.tags) ? wallpaper.tags.slice(0, 5).join(', ') : ''
      const keywords = [wallpaper.category, 'mobile wallpaper', 'phone background', ...tags.split(', ').filter(t => t)].join(', ')

      return `
    <url>
      <loc>${pageUrl}</loc>
      <image:image>
        <image:loc>${imageUrl}</image:loc>
        <image:title>${cleanTitle}</image:title>
        <image:caption>${cleanDescription}</image:caption>
        <image:geo_location>Global</image:geo_location>
        <image:license>${baseUrl}/license</image:license>
        <image:family_friendly>yes</image:family_friendly>
      </image:image>
      ${fullSizeUrl !== imageUrl ? `
      <image:image>
        <image:loc>${fullSizeUrl}</image:loc>
        <image:title>${cleanTitle} - Full Resolution</image:title>
        <image:caption>${cleanDescription} - Full quality download</image:caption>
        <image:geo_location>Global</image:geo_location>
        <image:license>${baseUrl}/license</image:license>
        <image:family_friendly>yes</image:family_friendly>
      </image:image>` : ''}
      <lastmod>${wallpaper.created_at}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`
    }).join('')

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${imageEntries}
</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating image sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}