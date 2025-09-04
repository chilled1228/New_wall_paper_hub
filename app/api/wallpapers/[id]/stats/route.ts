import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Get wallpaper stats
    const { data: stats, error } = await supabase
      .from('wallpaper_stats')
      .select('*')
      .eq('wallpaper_id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    // If no stats found, return zeros (wallpaper exists but no interactions yet)
    if (!stats) {
      return NextResponse.json({
        wallpaper_id: id,
        downloads: 0,
        likes: 0,
        views: 0,
        created_at: null,
        updated_at: null
      })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}