import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const tag = searchParams.get('tag')
    const path = searchParams.get('path')

    // Check for secret to prevent unauthorized access
    if (secret !== process.env.REVALIDATE_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    // Revalidate by tag
    if (tag) {
      revalidateTag(tag)
      return NextResponse.json({ 
        revalidated: true, 
        message: `Tag '${tag}' revalidated`,
        timestamp: new Date().toISOString()
      })
    }

    // Revalidate by path
    if (path) {
      revalidatePath(path)
      return NextResponse.json({ 
        revalidated: true, 
        message: `Path '${path}' revalidated`,
        timestamp: new Date().toISOString()
      })
    }

    // Revalidate common wallpaper-related paths if no specific tag/path provided
    const commonPaths = [
      '/',
      '/latest',
      '/popular',
      '/categories/nature',
      '/categories/minimal',
      '/categories/abstract',
      '/categories/urban',
      '/categories/space',
      '/categories/art'
    ]

    const commonTags = [
      'wallpapers',
      'category-nature',
      'category-minimal',
      'category-abstract',
      'category-urban',
      'category-space',
      'category-art'
    ]

    // Revalidate all common paths and tags
    for (const pathToRevalidate of commonPaths) {
      revalidatePath(pathToRevalidate)
    }

    for (const tagToRevalidate of commonTags) {
      revalidateTag(tagToRevalidate)
    }

    return NextResponse.json({ 
      revalidated: true, 
      message: 'All wallpaper caches cleared',
      revalidatedPaths: commonPaths,
      revalidatedTags: commonTags,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate' }, 
      { status: 500 }
    )
  }
}

// Allow GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}