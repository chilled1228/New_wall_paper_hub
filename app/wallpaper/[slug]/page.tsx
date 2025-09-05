import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { Footer } from "@/components/footer"
import { WallpaperDetails } from "@/components/wallpaper-details"
import { RelatedWallpapers } from "@/components/related-wallpapers"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import {
  generateImageStructuredData,
  generateOpenGraphMeta,
  generateTwitterMeta,
  generateCanonicalUrl,
  generateMetaKeywords
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

// Optimized function to get wallpaper with stats using correct UUID matching
async function getWallpaperWithStats(shortId: string): Promise<WallpaperWithStats | null> {
  try {
    // Use SQL RIGHT function to match the last 8 characters correctly
    let { data: wallpapers, error: wallpaperError } = await supabase
      .from('wallpapers')
      .select('*')
      .filter('id', 'like', `%${shortId}`)
      .limit(1)
      
    if (wallpaperError || !wallpapers || wallpapers.length === 0) {
      console.log(`No wallpapers found with shortId: ${shortId}, trying fallback`)
      // Fallback: use a more targeted query
      const { data: fallbackWallpapers } = await supabase
        .from('wallpapers')
        .select('*')
        .limit(100)
        .order('created_at', { ascending: false })
        
      const filtered = fallbackWallpapers?.filter(w => {
        // Get the last 8 characters of the UUID properly
        const fullId = w.id.toString()
        const lastEight = fullId.slice(-8)
        return lastEight === shortId
      }) || []
      
      console.log(`Fallback found ${filtered.length} wallpapers`)
      if (filtered.length === 0) return null
      wallpapers = filtered
    }
    
    const wallpaper = wallpapers[0]
    if (!wallpaper) return null
    
    // Get stats separately for compatibility
    const { data: stats } = await supabase
      .from('wallpaper_stats')
      .select('downloads, likes, views')
      .eq('wallpaper_id', wallpaper.id)
      .maybeSingle()
    
    const downloads = stats?.downloads || 0
    const likes = stats?.likes || 0  
    const views = stats?.views || 0
    
    return {
      ...wallpaper,
      stats,
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
  } catch (error) {
    console.error('Error fetching wallpaper:', error)
    return null
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

    // Validate slug format
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
    const structuredData = generateImageStructuredData(wallpaper, `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/wallpaper/${slug}`)

    return (
      <div className="min-h-screen bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
          <main>
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

    // Use the same optimized query as the main component
    const wallpaper = await getWallpaperWithStats(shortId)
    
    if (!wallpaper) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/wallpaper/${slug}`
    const title = `${wallpaper.title} - Free ${wallpaper.category} Wallpaper | WallpaperHub`
    const description = wallpaper.description || `Download ${wallpaper.title} wallpaper for free. High-quality ${wallpaper.category.toLowerCase()} wallpaper available in multiple resolutions.`
    const keywords = [
      ...new Set([
        wallpaper.title.toLowerCase(),
        wallpaper.category.toLowerCase(),
        'wallpaper',
        'mobile wallpaper',
        'phone wallpaper',
        'free wallpaper',
        'hd wallpaper',
        ...(wallpaper.tags || [])
      ])
    ].join(', ')

    return {
      title,
      description,
      keywords,
      authors: [{ name: wallpaper.author || "WallpaperHub" }],
      creator: wallpaper.author || "WallpaperHub",
      publisher: "WallpaperHub",
      category: wallpaper.category,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'WallpaperHub',
        images: [
          {
            url: wallpaper.image_url,
            width: 1080,
            height: 1920,
            alt: `${wallpaper.title} - ${wallpaper.category} wallpaper preview`,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [wallpaper.image_url],
        creator: '@wallpaperhub',
        site: '@wallpaperhub',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      other: {
        "pinterest-rich-pin": "true",
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: "Wallpaper Not Found | WallpaperHub",
      description: "The requested wallpaper could not be found.",
    }
  }
}