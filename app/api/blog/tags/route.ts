import { NextRequest, NextResponse } from 'next/server'
import { getAllTags, createTag, generateSlug } from '@/lib/blog'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const tags = await getAllTags()
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
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
      data.slug = generateSlug(data.name)
    }
    
    const tagId = await createTag(data)
    
    if (!tagId) {
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      id: tagId 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}