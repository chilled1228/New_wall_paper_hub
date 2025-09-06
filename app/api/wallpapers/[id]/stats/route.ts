import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wallpaperId } = await params
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

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

    // Check if user has liked this wallpaper (if deviceId provided)
    let isLiked = false
    if (deviceId) {
      const { data: likeData, error: likeError } = await supabase
        .from('wallpaper_likes')
        .select('id')
        .eq('wallpaper_id', wallpaperId)
        .eq('device_id', deviceId)
        .maybeSingle()

      isLiked = !likeError && !!likeData
    }

    const response = NextResponse.json({
      downloads: stats?.downloads || 0,
      likes: stats?.likes || 0,
      views: stats?.views || 0,
      isLiked
    })
    
    // Reduce cache time since we need fresher data for accuracy
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=10')
    
    return response

  } catch (error) {
    console.error('Error fetching wallpaper stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
