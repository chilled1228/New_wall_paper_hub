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
async function addRealStats(wallpaper: any): Promise<WallpaperWithStats> {
  // Get real stats from database
  const { data: stats } = await supabase
    .from('wallpaper_stats')
    .select('*')
    .eq('wallpaper_id', wallpaper.id)
    .single()

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

    // Add real stats from database
    const wallpaperWithStats = await addRealStats(wallpaper)

    return NextResponse.json(wallpaperWithStats)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
