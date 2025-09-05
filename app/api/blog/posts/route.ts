import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, createPost, generateSlug, calculateReadingTime, extractKeywords } from '@/lib/blog'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    
    const posts = await getAllPosts(status)
    
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication for admin routes
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title)
    }
    
    // Calculate reading time
    data.reading_time = calculateReadingTime(data.content)
    
    // Extract keywords
    if (!data.keywords || data.keywords.length === 0) {
      data.keywords = extractKeywords(data.content, data.title)
    }
    
    // Set author if not provided
    if (!data.author) {
      data.author = 'Admin'
    }
    
    const postId = await createPost(data)
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      id: postId 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}