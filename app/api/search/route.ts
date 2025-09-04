import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { WallpaperWithStats } from '@/lib/database.types'

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
  if (!wallpapers.length) return []
  
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const category = searchParams.get('category')?.toLowerCase().trim()
    const resolution = searchParams.get('resolution')?.toLowerCase().trim()
    const orientation = searchParams.get('orientation')?.toLowerCase().trim()
    const color = searchParams.get('color')?.toLowerCase().trim()
    const sortBy = searchParams.get('sort') || 'popular'
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24'), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // Validate search query length
    if (query && query.length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    let supabaseQuery = supabase
      .from('wallpapers')
      .select('*')

    // Apply search query filter
    if (query) {
      const escapedQuery = query.replace(/[%_]/g, '\\$&')
      supabaseQuery = supabaseQuery.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,category.ilike.%${escapedQuery}%`)
    }

    // Apply category filter
    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category)
    }

    // Apply tag-based filters (color, resolution, orientation stored in tags)
    if (color || resolution || orientation) {
      const tagFilters = []
      if (color) tagFilters.push(color)
      if (resolution) tagFilters.push(resolution)
      if (orientation) tagFilters.push(orientation)
      
      // Use overlaps operator to check if any of the tags match
      supabaseQuery = supabaseQuery.overlaps('tags', tagFilters)
    }

    // Apply limit and offset
    supabaseQuery = supabaseQuery
      .range(offset, offset + limit - 1)

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
        break
      case 'oldest':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: true })
        break
      case 'alphabetical':
        supabaseQuery = supabaseQuery.order('title', { ascending: true })
        break
      default: // popular, downloads, likes, trending
        // For popularity-based sorting, we'll fetch data and sort after getting stats
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
        break
    }

    const { data: wallpapers, error } = await supabaseQuery

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to search wallpapers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    // Validate and filter wallpapers
    const validWallpapers = (wallpapers || []).filter(wallpaper => {
      if (!wallpaper.id || !wallpaper.title || !wallpaper.image_url) {
        console.warn('Invalid wallpaper data:', wallpaper.id)
        return false
      }
      return true
    })

    // Add real stats from database
    let wallpapersWithStats = await addRealStats(validWallpapers)

    // Apply stats-based sorting if needed
    if (['popular', 'downloads', 'likes', 'trending'].includes(sortBy)) {
      wallpapersWithStats.sort((a, b) => {
        switch (sortBy) {
          case 'downloads':
            return (b.stats?.downloads || 0) - (a.stats?.downloads || 0)
          case 'likes':
            return (b.stats?.likes || 0) - (a.stats?.likes || 0)
          case 'trending':
            // Trending based on recent activity (views + likes in last period)
            const trendingA = (a.stats?.views || 0) + (a.stats?.likes || 0) * 2
            const trendingB = (b.stats?.views || 0) + (b.stats?.likes || 0) * 2
            return trendingB - trendingA
          default: // popular
            const popularityA = (a.stats?.downloads || 0) + (a.stats?.likes || 0) + (a.stats?.views || 0) * 0.1
            const popularityB = (b.stats?.downloads || 0) + (b.stats?.likes || 0) + (b.stats?.views || 0) * 0.1
            return popularityB - popularityA
        }
      })
    }

    // Get total count for pagination (simplified - in production you'd want a separate count query)
    const totalCount = wallpapersWithStats.length

    return NextResponse.json({
      wallpapers: wallpapersWithStats,
      totalCount,
      hasMore: wallpapersWithStats.length === limit,
      query,
      filters: {
        category,
        resolution,
        orientation,
        color,
        sortBy
      }
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}