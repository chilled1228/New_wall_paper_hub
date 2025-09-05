import { NextRequest, NextResponse } from 'next/server'
import { getRelatedPosts } from '@/lib/blog'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4', 10)
    
    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 20) // Between 1 and 20
    
    const relatedPosts = await getRelatedPosts(id, validLimit)
    
    return NextResponse.json(relatedPosts, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related posts' },
      { status: 500 }
    )
  }
}