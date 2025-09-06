import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  
  try {
    // Get all unique categories
    const { data: categoriesData } = await supabase
      .from('wallpapers')
      .select('category, updated_at')
      .order('category')
    
    if (!categoriesData) {
      return new NextResponse('No categories found', { status: 404 })
    }
    
    // Group by category and get latest update
    const categoryMap = new Map<string, Date>()
    categoriesData.forEach(item => {
      const existing = categoryMap.get(item.category)
      const currentDate = new Date(item.updated_at)
      if (!existing || currentDate > existing) {
        categoryMap.set(item.category, currentDate)
      }
    })
    
    const categories = Array.from(categoryMap.entries()).map(([category, lastModified]) => ({
      category,
      lastModified: lastModified.toISOString(),
      slug: category.toLowerCase().replace(/\s+/g, '-')
    }))
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories.map(({ category, lastModified, slug }) => `  <url>
    <loc>${baseUrl}/categories/${slug}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error generating categories sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}