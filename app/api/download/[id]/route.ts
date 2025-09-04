import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Wallpaper ID is required' }, { status: 400 })
    }

    // Get wallpaper info from database
    const { data: wallpaper, error } = await supabase
      .from('wallpapers')
      .select('id, title, original_url')
      .eq('id', id)
      .single()

    if (error || !wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 })
    }

    // Only use original URL for downloads (highest quality)
    const imageUrl = wallpaper.original_url

    if (!imageUrl) {
      return NextResponse.json({ error: 'Original wallpaper not available' }, { status: 404 })
    }

    try {
      // Fetch the image
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'WallpaperHub/1.0'
        }
      })

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
      
      // Get file extension from content type
      const extension = contentType.split('/')[1] || 'jpg'
      const filename = `${wallpaper.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.${extension}`

      // Return the image with download headers
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': imageBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      })

    } catch (fetchError) {
      console.error('Failed to fetch image:', fetchError)
      
      // Fallback: redirect to the image URL directly
      return NextResponse.redirect(imageUrl, 302)
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    )
  }
}

// Also handle POST requests for consistency
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return GET(request, context)
}