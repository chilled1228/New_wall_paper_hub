import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { Footer } from "@/components/footer"
import { WallpaperDetails } from "@/components/wallpaper-details"
import { RelatedWallpapers } from "@/components/related-wallpapers"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import {
  generateEnhancedWallpaperStructuredData,
  generateWallpaperMetadata,
  generateBreadcrumbStructuredData
} from "@/lib/seo-utils"
import {
  findWallpaperBySlug,
  isValidSlugFormat,
  generateCanonicalSlug,
  extractIdFromSlug,
  generateWallpaperSlug
} from "@/lib/slug-utils"

// Helper function to format numbers for display
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Highly optimized function to get wallpaper with stats in a single query
async function getWallpaperWithStats(shortId: string): Promise<WallpaperWithStats | null> {
  try {
    // First get wallpaper IDs using RPC function, then get full data
    const { data: wallpaperIds, error: idError } = await supabase
      .rpc('find_wallpapers_by_suffix', { suffix_param: shortId })
    
    if (idError || !wallpaperIds || wallpaperIds.length === 0) {
      console.error('Database error:', idError)
      return null
    }

    // Get the full wallpaper data using the found ID
    const { data: wallpapers, error: wallpaperError } = await supabase
      .from('wallpapers')
      .select('id, title, description, category, tags, image_url, thumbnail_url, medium_url, large_url, original_url, created_at')
      .eq('id', wallpaperIds[0].id)
      .limit(1)
      
    if (wallpaperError) {
      console.error('Database error:', wallpaperError)
      return null
    }

    // Get the first match (there should typically be only one)
    const wallpaper = wallpapers?.[0]
    
    if (!wallpaper) return null
    
    // Get stats separately but efficiently
    const { data: stats } = await supabase
      .from('wallpaper_stats')
      .select('downloads, likes, views')
      .eq('wallpaper_id', wallpaper.id)
      .maybeSingle()
    
    return formatWallpaperWithStats(wallpaper, stats || { downloads: 0, likes: 0, views: 0 })
  } catch (error) {
    console.error('Error fetching wallpaper:', error)
    return null
  }
}

// Helper function to format wallpaper data with stats
function formatWallpaperWithStats(wallpaper: any, stats: any): WallpaperWithStats {
  const downloads = stats?.downloads || 0
  const likes = stats?.likes || 0  
  const views = stats?.views || 0
  
  return {
    ...wallpaper,
    stats: stats,
    downloads: formatNumber(downloads),
    likes: formatNumber(likes),
    views: formatNumber(views),
    featured: views > 100,
    resolutions: [
      { label: "HD (720p)", width: 720, height: 1280, size: "1.2 MB" },
      { label: "Full HD (1080p)", width: 1080, height: 1920, size: "2.8 MB" },
      { label: "2K (1440p)", width: 1440, height: 2560, size: "4.5 MB" },
      { label: "4K (2160p)", width: 2160, height: 3840, size: "8.2 MB" },
    ],
    colors: ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"],
    uploadDate: wallpaper.created_at?.split('T')[0] || "2024-01-01",
    author: "WallpaperHub"
  }
}



interface WallpaperPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  try {
    const { slug } = await params

    // Validate slug format early for better performance
    if (!isValidSlugFormat(slug)) {
      notFound()
    }

    // Extract ID from slug
    const shortId = extractIdFromSlug(slug)
    if (!shortId) {
      notFound()
    }

    // Get wallpaper with stats in single optimized query
    const wallpaper = await getWallpaperWithStats(shortId)
    
    if (!wallpaper) {
      notFound()
    }

    // Generate canonical slug for this wallpaper
    const canonicalSlug = generateWallpaperSlug(wallpaper)
    
    // If the current slug doesn't match the canonical slug, redirect
    if (slug !== canonicalSlug) {
      redirect(`/wallpaper/${canonicalSlug}`)
    }

    // Generate structured data for SEO
    const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/wallpaper/${slug}`
    const structuredData = generateEnhancedWallpaperStructuredData(wallpaper, pageUrl)
    
    // Generate breadcrumb structured data
    const breadcrumbs = [
      { name: 'Home', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com' },
      { name: 'Categories', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/categories` },
      { name: wallpaper.category, url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/categories/${wallpaper.category.toLowerCase()}` },
      { name: wallpaper.title, url: pageUrl }
    ]
    const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbData),
          }}
        />
          <main className="flex-1">
          <WallpaperDetails wallpaper={wallpaper} />
          <RelatedWallpapers currentWallpaper={wallpaper} />
        </main>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error('Error loading wallpaper page:', error)
    notFound()
  }
}

// Performance optimizations
export const revalidate = 3600 // Cache for 1 hour
export const dynamic = 'force-dynamic' // Ensure real-time stats
export const fetchCache = 'auto' // Allow intelligent caching

// Generate static params for popular wallpapers (commented out for dynamic rendering)
// export async function generateStaticParams() {
//   try {
//     // Use Supabase client directly to avoid circular dependencies and API calls during build
//     const { supabase } = await import('@/lib/supabase')
//     
//     const { data: wallpapers, error } = await supabase
//       .from('wallpapers')
//       .select('id, title, category')
//       .limit(20)
//       .order('created_at', { ascending: false })

//     if (error) {
//       console.warn('Failed to fetch wallpapers for static generation:', error)
//       return []
//     }

//     // Return the wallpaper slugs for static generation
//     return wallpapers?.map((wallpaper) => ({
//       slug: generateWallpaperSlug(wallpaper),
//     })) || []
//   } catch (error) {
//     console.warn('Error generating static params:', error)
//     return []
//   }
// }

// Generate metadata for each wallpaper - OPTIMIZED VERSION
export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  try {
    const { slug } = await params

    // Validate slug format
    if (!isValidSlugFormat(slug)) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    // Extract ID from slug
    const shortId = extractIdFromSlug(slug)
    if (!shortId) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    // First get wallpaper IDs using RPC function, then get metadata
    const { data: wallpaperIds, error: idError } = await supabase
      .rpc('find_wallpapers_by_suffix', { suffix_param: shortId })
    
    if (idError || !wallpaperIds || wallpaperIds.length === 0) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    // Get the wallpaper metadata using the found ID
    const { data: wallpapers, error } = await supabase
      .from('wallpapers')
      .select('id, title, description, category, image_url, created_at')
      .eq('id', wallpaperIds[0].id)
      .limit(1)
    
    if (error) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }
    
    // Get the first match (there should typically be only one)
    const wallpaper = wallpapers?.[0]
    
    if (!wallpaper) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }
    
    // Generate comprehensive metadata using the utility function
    const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/wallpaper/${slug}`
    
    // Create a minimal wallpaper object for metadata generation
    const wallpaperForMetadata = {
      ...wallpaper,
      stats: undefined,
      downloads: "0",
      likes: "0", 
      views: "0",
      featured: false,
      resolutions: [],
      colors: [],
      uploadDate: wallpaper.created_at?.split('T')[0] || "2024-01-01",
      author: "WallpaperHub",
      tags: [],
      original_url: wallpaper.image_url
    }
    
    return generateWallpaperMetadata(wallpaperForMetadata, pageUrl)
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: "Wallpaper Not Found | WallpaperHub",
      description: "The requested wallpaper could not be found.",
    }
  }
}