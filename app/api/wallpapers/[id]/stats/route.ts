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

    // Get current stats from wallpaper_stats table
    const { data: stats } = await supabase
      .from('wallpaper_stats')
      .select('*')
      .eq('wallpaper_id', wallpaperId)
      .single()

    return NextResponse.json({
      downloads: stats?.downloads || 0,
      likes: stats?.likes || 0,
      views: stats?.views || 0
    })

  } catch (error) {
    console.error('Error fetching wallpaper stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
