import { notFound, redirect } from "next/navigation"
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
import {
  findWallpaperBySlug,
  isValidSlugFormat,
  generateCanonicalSlug,
  extractIdFromSlug,
  generateWallpaperSlug
} from "@/lib/slug-utils"


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

    // Find wallpaper by the short ID (last 8 characters of UUID)
    // For now, get a limited set of wallpapers and filter in JavaScript for compatibility
    const { data: allWallpapers, error } = await supabase
      .from('wallpapers')
      .select('*')
      .limit(100) // Limit to recent wallpapers to avoid performance issues
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching wallpapers:', error)
      notFound()
    }
    
    // Filter for wallpapers whose ID ends with the short ID
    const wallpapers = allWallpapers?.filter(w => w.id.endsWith(shortId)) || []

    if (wallpapers.length === 0) {
      notFound()
    }

    // Get the exact wallpaper (should only be one with matching short ID)
    const wallpaperData = wallpapers[0]
    const wallpaper = wallpaperData as WallpaperWithStats

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

// Generate metadata for each wallpaper
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

    // Find wallpaper by the short ID  
    // For now, get a limited set of wallpapers and filter in JavaScript for compatibility
    const { data: allWallpapers, error } = await supabase
      .from('wallpapers')
      .select('*')
      .limit(100) // Limit to recent wallpapers to avoid performance issues
      .order('created_at', { ascending: false })
    
    if (error) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }
    
    // Filter for wallpapers whose ID ends with the short ID
    const wallpapers = allWallpapers?.filter(w => w.id.endsWith(shortId)) || []

    if (wallpapers.length === 0) {
      return {
        title: "Wallpaper Not Found | WallpaperHub",
        description: "The requested wallpaper could not be found.",
      }
    }

    const wallpaperData = wallpapers[0]
    const wallpaper = wallpaperData as WallpaperWithStats

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