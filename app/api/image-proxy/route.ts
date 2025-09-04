import { NextRequest, NextResponse } from 'next/server'

// Simple image proxy for handling CORS and basic optimizations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const quality = parseInt(searchParams.get('quality') || '80')
    const width = searchParams.get('w')
    const height = searchParams.get('h')

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 })
    }

    // Validate URL to prevent SSRF attacks
    try {
      const url = new URL(imageUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'WallpaperHub/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const imageBuffer = await response.arrayBuffer()

    // Basic image validation (check for valid image headers)
    const uint8Array = new Uint8Array(imageBuffer)
    const isValidImage = 
      // JPEG
      (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) ||
      // PNG
      (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) ||
      // WebP
      (uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50)

    if (!isValidImage) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}