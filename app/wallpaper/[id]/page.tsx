import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Header } from "@/components/header"
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

// Helper function to add mock stats to wallpapers for UI compatibility
function addMockStats(wallpaper: any): WallpaperWithStats {
  // Generate consistent mock data based on wallpaper ID
  const id = wallpaper.id
  const hash = id.split('').reduce((a: number, b: string) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const downloads = Math.abs(hash % 50) + 5 // 5-55K downloads
  const likes = Math.abs(hash % 10) + 1 // 1-11K likes
  const views = downloads * 3 + Math.abs(hash % 20) // Views based on downloads
  
  return {
    ...wallpaper,
    downloads: `${downloads}.${Math.abs(hash % 10)}K`,
    likes: `${likes}.${Math.abs(hash % 10)}K`,
    views: `${views}.${Math.abs(hash % 10)}K`,
    featured: Math.abs(hash % 3) === 0, // ~33% chance of being featured
    resolutions: [
      { label: "HD (720p)", width: 720, height: 1280, size: "1.2 MB" },
      { label: "Full HD (1080p)", width: 1080, height: 1920, size: "2.8 MB" },
      { label: "2K (1440p)", width: 1440, height: 2560, size: "4.5 MB" },
      { label: "4K (2160p)", width: 2160, height: 3840, size: "8.2 MB" },
    ],
    colors: ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"], // Default colors
    uploadDate: wallpaper.created_at?.split('T')[0] || "2024-01-01",
    author: "WallpaperHub"
  }
}
interface WallpaperPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      notFound()
    }

    // Fetch wallpaper directly from Supabase instead of making HTTP requests
    const { data: wallpaperData, error } = await supabase
      .from('wallpapers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !wallpaperData) {
      console.error('Error fetching wallpaper:', error)
      notFound()
    }

    // Add mock stats for UI compatibility
    const wallpaper = addMockStats(wallpaperData)

    // Generate structured data for SEO
    const structuredData = generateImageStructuredData(wallpaper, `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/wallpaper/${id}`)

    return (
      <div className="min-h-screen bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <Header />
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

// Generate static params for popular wallpapers to improve performance
export async function generateStaticParams() {
  try {
    // Use Supabase client directly to avoid circular dependencies and API calls during build
    const { supabase } = await import('@/lib/supabase')
    
    const { data: wallpapers, error } = await supabase
      .from('wallpapers')
      .select('id')
      .limit(20)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Failed to fetch wallpapers for static generation:', error)
      return []
    }

    // Return the wallpaper IDs for static generation
    return wallpapers?.map((wallpaper) => ({
      id: wallpaper.id,
    })) || []
  } catch (error) {
    console.warn('Error generating static params:', error)
    return []
  }
}

// Generate metadata for each wallpaper
export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    // Fetch wallpaper directly from Supabase instead of making HTTP requests
    const { data: wallpaperData, error } = await supabase
      .from('wallpapers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !wallpaperData) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    // Add mock stats for UI compatibility
    const wallpaper = addMockStats(wallpaperData)

    const canonicalUrl = generateCanonicalUrl(id)
    const title = `${wallpaper.title} - Free ${wallpaper.category} Wallpaper | WallpaperHub`
    const description = wallpaper.description || `Download ${wallpaper.title} wallpaper for free. High-quality ${wallpaper.category.toLowerCase()} wallpaper available in multiple resolutions.`
    const keywords = generateMetaKeywords(wallpaper)

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
      openGraph: generateOpenGraphMeta(wallpaper, canonicalUrl),
      twitter: generateTwitterMeta(wallpaper),
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
