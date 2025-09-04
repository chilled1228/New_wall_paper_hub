import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UserInteractionInsert } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallpaper_id, interaction_type, session_id } = body

    // Validate required fields
    if (!wallpaper_id || !interaction_type || !session_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: wallpaper_id, interaction_type, session_id' 
      }, { status: 400 })
    }

    // Validate interaction type
    if (!['view', 'like', 'download'].includes(interaction_type)) {
      return NextResponse.json({ 
        error: 'Invalid interaction_type. Must be: view, like, or download' 
      }, { status: 400 })
    }

    // Validate UUID format for wallpaper_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(wallpaper_id)) {
      return NextResponse.json({ error: 'Invalid wallpaper ID format' }, { status: 400 })
    }

    // Get client IP for analytics
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // For likes, check if user already liked this wallpaper (prevent spam)
    if (interaction_type === 'like') {
      const { data: existingLike } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('wallpaper_id', wallpaper_id)
        .eq('session_id', session_id)
        .eq('interaction_type', 'like')
        .single()

      if (existingLike) {
        return NextResponse.json({ 
          error: 'User has already liked this wallpaper' 
        }, { status: 400 })
      }
    }

    // Insert interaction record
    const interactionData: UserInteractionInsert = {
      wallpaper_id,
      session_id,
      interaction_type,
      user_ip: ip
    }

    const { data: interaction, error } = await supabase
      .from('user_interactions')
      .insert(interactionData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting interaction:', error)
      return NextResponse.json({
        error: 'Failed to record interaction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    // Update wallpaper stats based on interaction type
    if (interaction_type === 'download') {
      // Count total downloads for this wallpaper
      const { count: totalDownloads } = await supabase
        .from('user_interactions')
        .select('*', { count: 'exact' })
        .eq('wallpaper_id', wallpaper_id)
        .eq('interaction_type', 'download')

      // Update or create wallpaper stats
      const { data: currentStats } = await supabase
        .from('wallpaper_stats')
        .select('*')
        .eq('wallpaper_id', wallpaper_id)
        .single()

      if (currentStats) {
        // Update existing stats
        await supabase
          .from('wallpaper_stats')
          .update({
            downloads: totalDownloads || 0,
            updated_at: new Date().toISOString()
          })
          .eq('wallpaper_id', wallpaper_id)
      } else {
        // Create new stats record
        await supabase
          .from('wallpaper_stats')
          .insert({
            wallpaper_id,
            downloads: totalDownloads || 0,
            likes: 0,
            views: 0
          })
      }

      return NextResponse.json({ 
        success: true,
        interaction: interaction,
        totalDownloads: totalDownloads || 0
      })
    }

    // Get updated stats for other interaction types
    const { data: stats } = await supabase
      .from('wallpaper_stats')
      .select('*')
      .eq('wallpaper_id', wallpaper_id)
      .single()

    return NextResponse.json({ 
      success: true,
      interaction: interaction,
      stats: stats
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}