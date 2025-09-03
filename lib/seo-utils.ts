import { WallpaperWithStats } from './database.types'

/**
 * Generate SEO-optimized alt text for wallpaper images
 * @param wallpaper - The wallpaper object
 * @param context - Additional context for the alt text (e.g., 'thumbnail', 'preview', 'full-size')
 * @returns Optimized alt text string
 */
export function generateAltText(wallpaper: WallpaperWithStats, context: 'thumbnail' | 'preview' | 'full-size' = 'full-size'): string {
  const { title, category, tags } = wallpaper
  
  // Base alt text with title and category
  let altText = `${title} - ${category} wallpaper`
  
  // Add relevant tags (limit to 3 most relevant)
  if (tags && tags.length > 0) {
    const relevantTags = tags.slice(0, 3).join(', ')
    altText += ` featuring ${relevantTags}`
  }
  
  // Add context-specific information
  switch (context) {
    case 'thumbnail':
      altText += ' (thumbnail)'
      break
    case 'preview':
      altText += ' (preview)'
      break
    case 'full-size':
      altText += ' for mobile devices'
      break
  }
  
  // Ensure alt text is not too long (recommended max 125 characters)
  if (altText.length > 125) {
    altText = altText.substring(0, 122) + '...'
  }
  
  return altText
}

/**
 * Generate structured data for wallpaper images
 * @param wallpaper - The wallpaper object
 * @param pageUrl - The current page URL
 * @returns Structured data object
 */
export function generateImageStructuredData(wallpaper: WallpaperWithStats, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": wallpaper.title,
    "description": wallpaper.description || `${wallpaper.title} - ${wallpaper.category} wallpaper`,
    "url": wallpaper.image_url,
    "contentUrl": wallpaper.image_url,
    "thumbnailUrl": wallpaper.image_url,
    "author": {
      "@type": "Person",
      "name": wallpaper.author || "WallpaperHub"
    },
    "publisher": {
      "@type": "Organization",
      "name": "WallpaperHub",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://wallpaperhub.com"
    },
    "datePublished": wallpaper.uploadDate || new Date().toISOString().split('T')[0],
    "dateModified": wallpaper.uploadDate || new Date().toISOString().split('T')[0],
    "keywords": wallpaper.tags?.join(", ") || wallpaper.category,
    "genre": wallpaper.category,
    "width": "1080",
    "height": "1920",
    "encodingFormat": "image/jpeg",
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "acquireLicensePage": pageUrl,
    "creditText": wallpaper.author || "WallpaperHub",
    "copyrightNotice": `© ${new Date().getFullYear()} ${wallpaper.author || "WallpaperHub"}`,
    "usageInfo": "Free for personal use",
    "isAccessibleForFree": true,
    "isFamilyFriendly": true
  }
}

/**
 * Generate Open Graph meta tags for wallpaper pages
 * @param wallpaper - The wallpaper object
 * @param pageUrl - The current page URL
 * @returns Open Graph meta object
 */
export function generateOpenGraphMeta(wallpaper: WallpaperWithStats, pageUrl: string) {
  const title = `${wallpaper.title} - Free ${wallpaper.category} Wallpaper | WallpaperHub`
  const description = wallpaper.description || `Download ${wallpaper.title} wallpaper for free. High-quality ${wallpaper.category.toLowerCase()} wallpaper available in multiple resolutions.`
  
  return {
    title,
    description,
    url: pageUrl,
    siteName: "WallpaperHub",
    images: [
      {
        url: wallpaper.image_url,
        width: 1080,
        height: 1920,
        alt: generateAltText(wallpaper, 'preview'),
      },
    ],
    locale: "en_US",
    type: "website",
  }
}

/**
 * Generate Twitter Card meta tags for wallpaper pages
 * @param wallpaper - The wallpaper object
 * @returns Twitter Card meta object
 */
export function generateTwitterMeta(wallpaper: WallpaperWithStats) {
  const title = `${wallpaper.title} - Free ${wallpaper.category} Wallpaper | WallpaperHub`
  const description = wallpaper.description || `Download ${wallpaper.title} wallpaper for free. High-quality ${wallpaper.category.toLowerCase()} wallpaper available in multiple resolutions.`
  
  return {
    card: "summary_large_image",
    title,
    description,
    images: [wallpaper.image_url],
    creator: "@wallpaperhub",
    site: "@wallpaperhub",
  }
}

/**
 * Generate canonical URL for wallpaper pages
 * @param wallpaperId - The wallpaper ID
 * @returns Canonical URL string
 */
export function generateCanonicalUrl(wallpaperId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  return `${baseUrl}/wallpaper/${wallpaperId}`
}

/**
 * Generate meta keywords from wallpaper data
 * @param wallpaper - The wallpaper object
 * @returns Comma-separated keywords string
 */
export function generateMetaKeywords(wallpaper: WallpaperWithStats): string {
  const keywords = [
    wallpaper.title.toLowerCase(),
    wallpaper.category.toLowerCase(),
    'wallpaper',
    'mobile wallpaper',
    'phone wallpaper',
    'free wallpaper',
    'hd wallpaper',
    ...(wallpaper.tags || [])
  ]
  
  // Remove duplicates and join
  return [...new Set(keywords)].join(', ')
}
