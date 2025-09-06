import { WallpaperWithStats } from './database.types'
import { Metadata } from 'next'

// Site configuration
const SITE_CONFIG = {
  name: 'WallpaperHub',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com',
  description: 'Discover and download thousands of high-quality mobile wallpapers',
  twitter: '@wallpaperhub',
  ogImage: '/og-image.jpg',
  twitterImage: '/twitter-image.jpg'
}

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
 * Generate enhanced structured data for wallpaper images with comprehensive schema
 * @param wallpaper - The wallpaper object
 * @param pageUrl - The current page URL
 * @returns Enhanced structured data object
 */
export function generateEnhancedWallpaperStructuredData(wallpaper: WallpaperWithStats, pageUrl: string) {
  const baseUrl = SITE_CONFIG.url
  
  return {
    "@context": "https://schema.org",
    "@type": ["ImageObject", "CreativeWork"],
    "@id": pageUrl,
    "name": wallpaper.title,
    "alternateName": `${wallpaper.title} - ${wallpaper.category} Wallpaper`,
    "description": wallpaper.description || `${wallpaper.title} - High-quality ${wallpaper.category.toLowerCase()} wallpaper for mobile devices`,
    "url": pageUrl,
    "contentUrl": wallpaper.image_url,
    "thumbnailUrl": wallpaper.thumbnail_url || wallpaper.image_url,
    "encodingFormat": "image/jpeg",
    "width": {
      "@type": "QuantitativeValue",
      "value": "1080",
      "unitCode": "E37"
    },
    "height": {
      "@type": "QuantitativeValue",
      "value": "1920",
      "unitCode": "E37"
    },
    "author": {
      "@type": "Person",
      "name": wallpaper.author || "WallpaperHub",
      "url": baseUrl
    },
    "creator": {
      "@type": "Person",
      "name": wallpaper.author || "WallpaperHub",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "WallpaperHub",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/icon-512.png`,
        "width": 512,
        "height": 512
      }
    },
    "uploadDate": wallpaper.uploadDate || new Date().toISOString(),
    "datePublished": wallpaper.uploadDate || new Date().toISOString(),
    "dateModified": wallpaper.uploadDate || new Date().toISOString(),
    "keywords": wallpaper.tags?.join(", ") || wallpaper.category,
    "genre": wallpaper.category,
    "about": {
      "@type": "Thing",
      "name": wallpaper.category,
      "description": `${wallpaper.category} themed wallpapers and backgrounds`
    },
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "acquireLicensePage": pageUrl,
    "creditText": wallpaper.author || "WallpaperHub",
    "copyrightNotice": `© ${new Date().getFullYear()} ${wallpaper.author || "WallpaperHub"}`,
    "usageInfo": "Free for personal use",
    "isAccessibleForFree": true,
    "isFamilyFriendly": true,
    "contentRating": "Everyone",
    "audience": {
      "@type": "Audience",
      "audienceType": "General Public"
    },
    "mainEntity": {
      "@type": "MediaObject",
      "name": wallpaper.title,
      "encodingFormat": "image/jpeg",
      "contentUrl": wallpaper.image_url,
      "uploadDate": wallpaper.uploadDate || new Date().toISOString(),
      "duration": "PT0S"
    },
    "isPartOf": {
      "@type": "Collection",
      "name": `${wallpaper.category} Wallpapers`,
      "url": `${baseUrl}/categories/${wallpaper.category.toLowerCase()}`
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ViewAction",
        "userInteractionCount": wallpaper.stats?.views || 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/DownloadAction",
        "userInteractionCount": wallpaper.stats?.downloads || 0
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": wallpaper.stats?.likes || 0
      }
    ],
    "potentialAction": [
      {
        "@type": "ViewAction",
        "target": pageUrl,
        "name": "View Wallpaper"
      },
      {
        "@type": "DownloadAction",
        "target": wallpaper.image_url,
        "name": "Download Wallpaper"
      },
      {
        "@type": "ShareAction",
        "target": pageUrl,
        "name": "Share Wallpaper"
      }
    ]
  }
}

/**
 * Generate blog post structured data
 * @param post - The blog post object
 * @returns Blog post structured data
 */
export function generateBlogStructuredData(post: any) {
  const baseUrl = SITE_CONFIG.url
  const postUrl = `${baseUrl}/blog/${post.slug}`
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": postUrl,
    "headline": post.title,
    "alternativeHeadline": post.subtitle || post.title,
    "description": post.excerpt || post.description,
    "url": postUrl,
    "datePublished": post.publishedAt || post.created_at,
    "dateModified": post.updatedAt || post.updated_at || post.publishedAt || post.created_at,
    "author": {
      "@type": "Person",
      "name": post.author || "WallpaperHub Team",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "WallpaperHub",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/icon-512.png`,
        "width": 512,
        "height": 512
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "image": post.featuredImage ? {
      "@type": "ImageObject",
      "url": post.featuredImage,
      "width": 1200,
      "height": 630
    } : undefined,
    "keywords": post.tags?.join(", ") || "wallpapers, mobile backgrounds",
    "articleSection": "Blog",
    "wordCount": post.content?.length || 0,
    "isAccessibleForFree": true,
    "isFamilyFriendly": true,
    "inLanguage": "en-US"
  }
}

/**
 * Generate category collection structured data
 * @param category - Category name
 * @param wallpapers - Array of wallpapers in category
 * @returns Category structured data
 */
export function generateCategoryStructuredData(category: string, wallpapers?: WallpaperWithStats[]) {
  const baseUrl = SITE_CONFIG.url
  const categoryUrl = `${baseUrl}/categories/${category.toLowerCase()}`
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": categoryUrl,
    "name": `${category} Wallpapers Collection`,
    "description": `Browse and download high-quality ${category.toLowerCase()} wallpapers for mobile devices`,
    "url": categoryUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "WallpaperHub",
      "url": baseUrl
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": `${category} Wallpapers`,
      "description": `Collection of ${category.toLowerCase()} wallpapers`,
      "numberOfItems": wallpapers?.length || 0,
      "itemListElement": wallpapers?.slice(0, 10).map((wallpaper, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "ImageObject",
          "@id": `${baseUrl}/wallpaper/${wallpaper.id}`,
          "name": wallpaper.title,
          "url": wallpaper.image_url,
          "thumbnailUrl": wallpaper.thumbnail_url || wallpaper.image_url
        }
      })) || []
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Categories",
          "item": `${baseUrl}/categories`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": category,
          "item": categoryUrl
        }
      ]
    }
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
 * Generate comprehensive metadata for wallpaper pages
 * @param wallpaper - The wallpaper object
 * @param pageUrl - The current page URL
 * @returns Next.js Metadata object
 */
export function generateWallpaperMetadata(wallpaper: WallpaperWithStats, pageUrl?: string): Metadata {
  const url = pageUrl || generateCanonicalUrl(wallpaper.id)
  const title = `${wallpaper.title} - Free ${wallpaper.category} Wallpaper | WallpaperHub`
  const description = wallpaper.description || 
    `Download ${wallpaper.title} wallpaper for free. High-quality ${wallpaper.category.toLowerCase()} wallpaper available in multiple resolutions for iPhone, Android, and all mobile devices.`

  return {
    title,
    description,
    keywords: generateMetaKeywords(wallpaper),
    authors: [{ name: wallpaper.author || 'WallpaperHub' }],
    creator: wallpaper.author || 'WallpaperHub',
    publisher: 'WallpaperHub',
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: SITE_CONFIG.name,
      publishedTime: wallpaper.uploadDate,
      modifiedTime: wallpaper.uploadDate,
      authors: [wallpaper.author || 'WallpaperHub'],
      section: wallpaper.category,
      tags: wallpaper.tags,
      images: [
        {
          url: wallpaper.image_url,
          width: 1080,
          height: 1920,
          alt: generateAltText(wallpaper, 'preview'),
        },
        {
          url: wallpaper.thumbnail_url || wallpaper.image_url,
          width: 150,
          height: 200,
          alt: generateAltText(wallpaper, 'thumbnail'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter,
      creator: SITE_CONFIG.twitter,
      title,
      description,
      images: {
        url: wallpaper.image_url,
        alt: generateAltText(wallpaper, 'preview'),
      },
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    other: {
      'article:author': wallpaper.author || 'WallpaperHub',
      'article:published_time': wallpaper.uploadDate || wallpaper.created_at || new Date().toISOString(),
      'article:modified_time': wallpaper.uploadDate || wallpaper.created_at || new Date().toISOString(),
      'article:section': wallpaper.category,
      'article:tag': wallpaper.tags?.join(', ') || wallpaper.category,
    },
  }
}

/**
 * Generate comprehensive metadata for blog pages
 * @param post - The blog post object
 * @returns Next.js Metadata object
 */
export function generateBlogMetadata(post: any): Metadata {
  const url = `${SITE_CONFIG.url}/blog/${post.slug}`
  const title = `${post.title} | WallpaperHub Blog`
  const description = post.excerpt || post.description || `Read ${post.title} on the WallpaperHub blog.`

  return {
    title,
    description,
    authors: [{ name: post.author || 'WallpaperHub Team' }],
    creator: post.author || 'WallpaperHub Team',
    publisher: 'WallpaperHub',
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: SITE_CONFIG.name,
      publishedTime: post.publishedAt || post.created_at,
      modifiedTime: post.updatedAt || post.updated_at,
      authors: [post.author || 'WallpaperHub Team'],
      section: 'Blog',
      tags: post.tags,
      images: post.featuredImage ? [
        {
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter,
      creator: SITE_CONFIG.twitter,
      title,
      description,
      images: post.featuredImage ? {
        url: post.featuredImage,
        alt: post.title,
      } : undefined,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  }
}

/**
 * Generate meta keywords from wallpaper data
 * @param wallpaper - The wallpaper object
 * @returns Array of keywords
 */
export function generateMetaKeywords(wallpaper: WallpaperWithStats): string[] {
  const keywords = [
    wallpaper.title.toLowerCase(),
    wallpaper.category.toLowerCase(),
    'wallpaper',
    'mobile wallpaper',
    'phone wallpaper', 
    'free wallpaper',
    'hd wallpaper',
    `${wallpaper.category.toLowerCase()} wallpaper`,
    `${wallpaper.category.toLowerCase()} background`,
    'iPhone wallpaper',
    'Android wallpaper',
    ...(wallpaper.tags || [])
  ]
  
  // Remove duplicates
  return [...new Set(keywords)]
}

/**
 * Generate breadcrumb structured data
 * @param breadcrumbs - Array of breadcrumb items
 * @returns Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }
}

/**
 * Generate FAQ structured data
 * @param faqs - Array of FAQ items
 * @returns FAQ structured data
 */
export function generateFAQStructuredData(faqs: Array<{question: string, answer: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

/**
 * Generate search results structured data
 * @param query - Search query
 * @param results - Search results
 * @param totalCount - Total number of results
 * @returns Search results structured data
 */
export function generateSearchResultsStructuredData(
  query: string, 
  results: WallpaperWithStats[], 
  totalCount: number
) {
  const baseUrl = SITE_CONFIG.url
  
  return {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": `Search Results for "${query}"`,
    "description": `Found ${totalCount} wallpapers matching "${query}"`,
    "url": `${baseUrl}/search?q=${encodeURIComponent(query)}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalCount,
      "itemListElement": results.slice(0, 10).map((wallpaper, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "ImageObject",
          "@id": `${baseUrl}/wallpaper/${wallpaper.id}`,
          "name": wallpaper.title,
          "url": wallpaper.image_url,
          "thumbnailUrl": wallpaper.thumbnail_url || wallpaper.image_url,
          "description": wallpaper.description || `${wallpaper.title} - ${wallpaper.category} wallpaper`
        }
      }))
    }
  }
}

/**
 * Generate comprehensive metadata for category pages
 * @param category - The category name
 * @param wallpaperCount - Number of wallpapers in category
 * @returns Next.js Metadata object
 */
export function generateCategoryMetadata(category: string, wallpaperCount?: number): Metadata {
  const url = `${SITE_CONFIG.url}/categories/${category.toLowerCase()}`
  const title = `${category} Wallpapers - Free HD ${category} Backgrounds | WallpaperHub`
  const description = `Browse ${wallpaperCount ? `${wallpaperCount}+` : 'thousands of'} high-quality ${category.toLowerCase()} wallpapers. Download free HD ${category.toLowerCase()} backgrounds for iPhone, Android, and all mobile devices.`

  return {
    title,
    description,
    keywords: [
      `${category.toLowerCase()} wallpapers`,
      `${category.toLowerCase()} backgrounds`,
      `HD ${category.toLowerCase()} wallpapers`,
      `free ${category.toLowerCase()} wallpapers`,
      'mobile wallpapers',
      'phone backgrounds'
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${category} Wallpapers - WallpaperHub`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter,
      creator: SITE_CONFIG.twitter,
      title,
      description,
      images: {
        url: SITE_CONFIG.twitterImage,
        alt: `${category} Wallpapers - WallpaperHub`,
      },
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}
