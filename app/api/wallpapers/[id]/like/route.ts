import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wallpaperId } = await params
    const body = await request.json()
    const { deviceId, action } = body // action: 'like' or 'unlike'

    if (!wallpaperId || !deviceId) {
      return NextResponse.json(
        { error: 'Wallpaper ID and device ID are required' },
        { status: 400 }
      )
    }

    // Check if this device has already interacted with this wallpaper
    const { data: existingInteraction } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('wallpaper_id', wallpaperId)
      .eq('session_id', deviceId)
      .eq('interaction_type', 'like')
      .single()

    if (action === 'like') {
      // If already liked, just return current state instead of error
      if (existingInteraction) {
        // Get current stats
        const { data: currentStats } = await supabase
          .from('wallpaper_stats')
          .select('*')
          .eq('wallpaper_id', wallpaperId)
          .single()

        return NextResponse.json({
          success: true,
          liked: true,
          totalLikes: currentStats?.likes || 1
        })
      }

      // Add like interaction
      const { error: interactionError } = await supabase
        .from('user_interactions')
        .insert({
          wallpaper_id: wallpaperId,
          session_id: deviceId,
          interaction_type: 'like',
          user_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

      if (interactionError) {
        console.error('Error saving like interaction:', interactionError)
      }

      // Count actual likes from user_interactions table (source of truth)
      const { count: totalLikes } = await supabase
        .from('user_interactions')
        .select('*', { count: 'exact' })
        .eq('wallpaper_id', wallpaperId)
        .eq('interaction_type', 'like')

      // Update or create wallpaper stats with actual count
      const { data: currentStats } = await supabase
        .from('wallpaper_stats')
        .select('*')
        .eq('wallpaper_id', wallpaperId)
        .single()

      if (currentStats) {
        // Update existing stats with actual count
        const { error: updateError } = await supabase
          .from('wallpaper_stats')
          .update({
            likes: totalLikes || 0,
            updated_at: new Date().toISOString()
          })
          .eq('wallpaper_id', wallpaperId)

        if (updateError) {
          console.error('Error updating wallpaper stats:', updateError)
        }
      } else {
        // Create new stats record with actual count
        const { error: createError } = await supabase
          .from('wallpaper_stats')
          .insert({
            wallpaper_id: wallpaperId,
            likes: totalLikes || 0,
            downloads: 0,
            views: 0
          })

        if (createError) {
          console.error('Error creating wallpaper stats:', createError)
        }
      }

      return NextResponse.json({
        success: true,
        liked: true,
        totalLikes: totalLikes || 0
      })

    } else if (action === 'unlike') {
      // If not previously liked, just return current state instead of error
      if (!existingInteraction) {
        // Get current stats
        const { data: currentStats } = await supabase
          .from('wallpaper_stats')
          .select('*')
          .eq('wallpaper_id', wallpaperId)
          .single()

        return NextResponse.json({
          success: true,
          liked: false,
          totalLikes: currentStats?.likes || 0
        })
      }

      // Remove like interaction
      const { error: removeError } = await supabase
        .from('user_interactions')
        .delete()
        .eq('wallpaper_id', wallpaperId)
        .eq('session_id', deviceId)
        .eq('interaction_type', 'like')

      if (removeError) {
        console.error('Error removing like interaction:', removeError)
      }

      // Count actual likes from user_interactions table (source of truth)
      const { count: totalLikes } = await supabase
        .from('user_interactions')
        .select('*', { count: 'exact' })
        .eq('wallpaper_id', wallpaperId)
        .eq('interaction_type', 'like')

      // Update wallpaper stats with actual count
      const { data: currentStats } = await supabase
        .from('wallpaper_stats')
        .select('*')
        .eq('wallpaper_id', wallpaperId)
        .single()

      if (currentStats) {
        const { error: updateError } = await supabase
          .from('wallpaper_stats')
          .update({
            likes: totalLikes || 0,
            updated_at: new Date().toISOString()
          })
          .eq('wallpaper_id', wallpaperId)

        if (updateError) {
          console.error('Error updating wallpaper stats:', updateError)
        }
      }

      return NextResponse.json({
        success: true,
        liked: false,
        totalLikes: totalLikes || 0
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "like" or "unlike"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error handling like request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has liked a wallpaper
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wallpaperId } = await params
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!wallpaperId || !deviceId) {
      return NextResponse.json(
        { error: 'Wallpaper ID and device ID are required' },
        { status: 400 }
      )
    }

    // Check if this device has liked this wallpaper
    const { data: interaction } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('wallpaper_id', wallpaperId)
      .eq('session_id', deviceId)
      .eq('interaction_type', 'like')
      .single()

    // Get current stats
    const { data: stats } = await supabase
      .from('wallpaper_stats')
      .select('*')
      .eq('wallpaper_id', wallpaperId)
      .single()

    return NextResponse.json({
      liked: !!interaction,
      totalLikes: stats?.likes || 0
    })

  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}