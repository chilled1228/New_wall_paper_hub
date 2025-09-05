import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wallpaperId } = await params

    if (!wallpaperId) {
      return NextResponse.json(
        { error: 'Wallpaper ID is required' },
        { status: 400 }
      )
    }

    // Get current stats from wallpaper_stats table with optimized query
    const { data: stats } = await supabase
      .from('wallpaper_stats')
      .select('downloads, likes, views')
      .eq('wallpaper_id', wallpaperId)
      .maybeSingle() // Use maybeSingle for better performance

    const response = NextResponse.json({
      downloads: stats?.downloads || 0,
      likes: stats?.likes || 0,
      views: stats?.views || 0
    })
    
    // Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=30')
    
    return response

  } catch (error) {
    console.error('Error fetching wallpaper stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
