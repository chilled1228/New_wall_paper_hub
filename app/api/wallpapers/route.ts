import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { WallpaperWithStats } from '@/lib/database.types'

// Helper function to add mock stats to wallpapers for UI compatibility
function addMockStats(wallpaper: any): WallpaperWithStats {
  // Generate consistent mock data based on wallpaper ID
  const id = wallpaper.id
  const hash = id.split('').reduce((a, b) => {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')
    const search = searchParams.get('search')

    // Validate and sanitize inputs
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit), 1), 100) : 20
    const sanitizedCategory = category?.toLowerCase().trim()
    const sanitizedSearch = search?.trim()

    if (sanitizedSearch && sanitizedSearch.length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
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
      return NextResponse.json({
        error: 'Failed to fetch wallpapers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    // Validate wallpapers data
    if (!wallpapers || !Array.isArray(wallpapers)) {
      console.error('Invalid wallpapers data received from database')
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 })
    }

    // Add mock stats for UI compatibility
    const wallpapersWithStats = wallpapers.map(wallpaper => {
      // Validate required fields
      if (!wallpaper.id || !wallpaper.title || !wallpaper.image_url) {
        console.warn('Wallpaper missing required fields:', wallpaper.id)
        return null
      }
      return addMockStats(wallpaper)
    }).filter(Boolean) // Remove null entries

    // Filter featured if requested
    let filteredWallpapers = wallpapersWithStats
    if (featured === 'true') {
      filteredWallpapers = wallpapersWithStats.filter(w => w.featured)
    }

    return NextResponse.json(filteredWallpapers)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
