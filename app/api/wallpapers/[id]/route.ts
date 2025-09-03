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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid wallpaper ID format' }, { status: 400 })
    }

    const { data: wallpaper, error } = await supabase
      .from('wallpapers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 })
      }
      return NextResponse.json({
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 })
    }

    // Validate required fields
    if (!wallpaper.title || !wallpaper.image_url) {
      console.error('Wallpaper missing required fields:', wallpaper.id)
      return NextResponse.json({ error: 'Invalid wallpaper data' }, { status: 500 })
    }

    // Add mock stats for UI compatibility
    const wallpaperWithStats = addMockStats(wallpaper)

    return NextResponse.json(wallpaperWithStats)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
