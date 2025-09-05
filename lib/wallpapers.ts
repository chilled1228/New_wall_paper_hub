import { WallpaperWithStats } from './database.types'
import { supabase } from './supabase'

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

// Helper function to add real stats to wallpapers
async function addRealStats(wallpapers: any[]): Promise<WallpaperWithStats[]> {
  // Get all wallpaper IDs
  const wallpaperIds = wallpapers.map(w => w.id)
  
  // Fetch stats for all wallpapers in one query
  const { data: allStats } = await supabase
    .from('wallpaper_stats')
    .select('*')
    .in('wallpaper_id', wallpaperIds)

  // Create a map of stats by wallpaper_id for quick lookup
  const statsMap = new Map()
  allStats?.forEach(stat => {
    statsMap.set(stat.wallpaper_id, stat)
  })

  // Add stats to each wallpaper
  return wallpapers.map(wallpaper => {
    const stats = statsMap.get(wallpaper.id)
    const downloads = stats?.downloads || 0
    const likes = stats?.likes || 0
    const views = stats?.views || 0
    
    return {
      ...wallpaper,
      stats,
      downloads: formatNumber(downloads),
      likes: formatNumber(likes),
      views: formatNumber(views),
      featured: views > 100, // Mark as featured if it has significant views
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
  })
}

export interface FetchWallpapersOptions {
  category?: string
  featured?: boolean
  limit?: number
  search?: string
}

export async function fetchWallpapers(options: FetchWallpapersOptions = {}): Promise<WallpaperWithStats[]> {
  try {
    // Validate and sanitize inputs
    const parsedLimit = options.limit ? Math.min(Math.max(options.limit, 1), 100) : 20
    const sanitizedCategory = options.category?.toLowerCase().trim()
    const sanitizedSearch = options.search?.trim()

    if (sanitizedSearch && sanitizedSearch.length < 2) {
      console.warn('Search query must be at least 2 characters')
      return []
    }

    let query = supabase
      .from('wallpapers')
      .select('*')

    // Apply filters
    if (sanitizedCategory) {
      query = query.eq('category', sanitizedCategory)
    }

    if (sanitizedSearch) {
      // Escape special characters for ILIKE
      const escapedSearch = sanitizedSearch.replace(/[%_]/g, '\\$&')
      query = query.or(`title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`)
    }

    // Apply limit
    query = query.limit(parsedLimit)

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: wallpapers, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return []
    }

    // Validate wallpapers data
    if (!wallpapers || !Array.isArray(wallpapers)) {
      console.error('Invalid wallpapers data received from database')
      return []
    }

    // Validate wallpapers and filter invalid ones
    const validWallpapers = wallpapers.filter(wallpaper => {
      if (!wallpaper.id || !wallpaper.title || !wallpaper.image_url) {
        console.warn('Wallpaper missing required fields:', wallpaper.id)
        return false
      }
      return true
    })

    // Add real stats from database
    const wallpapersWithStats = await addRealStats(validWallpapers)

    // Filter featured if requested
    let filteredWallpapers = wallpapersWithStats
    if (options.featured) {
      filteredWallpapers = wallpapersWithStats.filter(w => w.featured)
    }

    return filteredWallpapers
  } catch (error) {
    console.error('Error fetching wallpapers:', error)
    return []
  }
}

export async function fetchWallpaperById(id: string): Promise<WallpaperWithStats | null> {
  try {
    // First try to find by ID
    let { data: wallpaper, error } = await supabase
      .from('wallpapers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    // If not found by ID, try by slug (for slug-based URLs)
    if (!wallpaper && !error) {
      const { data: wallpaperBySlug, error: slugError } = await supabase
        .from('wallpapers')
        .select('*')
        .ilike('title', `%${id.replace(/-/g, ' ')}%`)
        .maybeSingle()
      
      wallpaper = wallpaperBySlug
      error = slugError
    }

    if (error) {
      console.error('Supabase error:', error)
      return null
    }

    if (!wallpaper) {
      return null
    }

    // Add stats to the wallpaper
    const wallpapersWithStats = await addRealStats([wallpaper])
    return wallpapersWithStats[0] || null
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
