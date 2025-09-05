import { NextRequest, NextResponse } from 'next/server'
import { getAllCategories, createCategory, generateSlug } from '@/lib/blog'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    
    const categoryId = await createCategory(data)
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      id: categoryId 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}