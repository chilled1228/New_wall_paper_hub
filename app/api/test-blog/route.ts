import { NextResponse } from 'next/server'
import { getPostBySlug, getAllPosts } from '@/lib/blog'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (slug) {
      const post = await getPostBySlug(slug)
      return NextResponse.json({ 
        success: !!post, 
        post,
        slug
      })
    }
    
    // Get all published posts
    const posts = await getAllPosts('published')
    return NextResponse.json({ 
      success: true, 
      count: posts.length,
      posts: posts.map(p => ({ id: p.id, title: p.title, slug: p.slug }))
    })
  } catch (error) {
    console.error('Test blog API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}