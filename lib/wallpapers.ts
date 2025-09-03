import { WallpaperWithStats } from './database.types'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : 'http://localhost:3000'

export interface FetchWallpapersOptions {
  category?: string
  featured?: boolean
  limit?: number
  search?: string
}

export async function fetchWallpapers(options: FetchWallpapersOptions = {}): Promise<WallpaperWithStats[]> {
  try {
    // Validate input parameters
    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      console.warn('Invalid limit provided, using default')
      options.limit = 20
    }

    const params = new URLSearchParams()

    if (options.category) params.append('category', options.category.toLowerCase())
    if (options.featured) params.append('featured', 'true')
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.search) params.append('search', options.search.trim())

    const url = `${API_BASE_URL}/api/wallpapers?${params.toString()}`
    const response = await fetch(url, {
      next: {
        revalidate: 600, // Cache for 10 minutes
        tags: ['wallpapers', ...(options.category ? [`category-${options.category}`] : [])]
      },
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch wallpapers: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()

    // Validate response data
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array')
    }

    return data
  } catch (error) {
    console.error('Error fetching wallpapers:', error)
    // Return empty array as fallback
    return []
  }
}

export async function fetchWallpaperById(id: string): Promise<WallpaperWithStats | null> {
  try {
    const url = `${API_BASE_URL}/api/wallpapers/${id}`
    const response = await fetch(url, {
      next: {
        revalidate: 3600, // Cache for 1 hour for better performance
        tags: [`wallpaper-${id}`] // Add cache tags for selective revalidation
      },
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch wallpaper: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching wallpaper:', error)
    return null
  }
}

// Helper function to get related wallpapers (same category, excluding current)
export async function fetchRelatedWallpapers(
  currentWallpaper: WallpaperWithStats, 
  limit: number = 6
): Promise<WallpaperWithStats[]> {
  try {
    const allWallpapers = await fetchWallpapers({ 
      category: currentWallpaper.category,
      limit: limit + 5 // Get extra to filter out current
    })
    
    // Filter out current wallpaper and limit results
    return allWallpapers
      .filter(w => w.id !== currentWallpaper.id)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching related wallpapers:', error)
    return []
  }
}

// Helper function to get popular wallpapers (sorted by mock stats)
export async function fetchPopularWallpapers(limit: number = 8): Promise<WallpaperWithStats[]> {
  try {
    const wallpapers = await fetchWallpapers({ limit: limit * 2 })
    
    // Sort by downloads (parse the string and sort)
    return wallpapers
      .sort((a, b) => {
        const aDownloads = parseFloat(a.downloads?.replace('K', '') || '0')
        const bDownloads = parseFloat(b.downloads?.replace('K', '') || '0')
        return bDownloads - aDownloads
      })
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching popular wallpapers:', error)
    return []
  }
}

// Helper function to get featured wallpapers
export async function fetchFeaturedWallpapers(limit: number = 4): Promise<WallpaperWithStats[]> {
  return fetchWallpapers({ featured: true, limit })
}
