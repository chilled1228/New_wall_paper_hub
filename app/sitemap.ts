import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { supabase } from '@/lib/supabase'

type SitemapEntry = {
  url: string
  lastModified?: string | Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  
  // Get all published blog posts
  const posts = await getAllPosts('published')
  
  // Get wallpapers (limit to recent 1000 for performance)
  const { data: wallpapers } = await supabase
    .from('wallpapers')
    .select('id, slug, title, updated_at, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)
  
  // Get categories
  const { data: categories } = await supabase
    .from('wallpapers')
    .select('category')
    .order('category')
  
  const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])]
  
  // Static pages with high importance
  const staticRoutes: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/latest`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/popular`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // Category routes
  const categoryRoutes: SitemapEntry[] = uniqueCategories.map((category) => ({
    url: `${baseUrl}/categories/${category.toLowerCase().replace(/ /g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Wallpaper routes - prioritize recent ones
  const wallpaperRoutes: SitemapEntry[] = (wallpapers || []).map((wallpaper, index) => ({
    url: `${baseUrl}/wallpaper/${wallpaper.slug || wallpaper.id}`,
    lastModified: new Date(wallpaper.updated_at || wallpaper.created_at),
    changeFrequency: 'monthly' as const,
    // Higher priority for newer wallpapers
    priority: Math.max(0.3, 0.8 - (index / 1000) * 0.4),
  }))

  // Blog post routes
  const blogRoutes: SitemapEntry[] = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    ...staticRoutes, 
    ...categoryRoutes, 
    ...wallpaperRoutes.slice(0, 800), // Limit to 800 wallpapers in main sitemap
    ...blogRoutes
  ]
}