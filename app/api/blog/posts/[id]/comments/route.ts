import { NextRequest, NextResponse } from 'next/server'
import { getPostComments, createComment } from '@/lib/blog'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await getPostComments(id)
    
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const data = await request.json()
    
    // Basic validation
    if (!data.author_name?.trim() || !data.author_email?.trim() || !data.content?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and content are required' },
        { status: 400 }
      )
    }

    if (data.author_name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      )
    }

    if (data.content.length < 3 || data.content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must be between 3 and 5000 characters' },
        { status: 400 }
      )
    }

    // Anti-spam validation - prevent links in content
    const linkPatterns = [
      /https?:\/\/[^\s]+/gi, // http/https links
      /www\.[^\s]+/gi, // www links
      /[^\s]+\.(com|net|org|edu|gov|mil|int|co|uk|de|fr|jp|cn|ru|br|au|ca|info|biz|tv|me|io|ly|cc|tk|ml|ga|cf)\b/gi, // domain extensions
      /@[^\s]+\.(com|net|org|edu|gov|mil|int|co|uk|de|fr|jp|cn|ru|br|au|ca|info|biz|tv|me|io|ly|cc|tk|ml|ga|cf)\b/gi, // email-like patterns
      /\b\w+\s*\.\s*(com|net|org|edu|gov|mil|int|co|uk|de|fr|jp|cn|ru|br|au|ca|info|biz|tv|me|io|ly|cc|tk|ml|ga|cf)\b/gi // spaced domains
    ]

    for (const pattern of linkPatterns) {
      if (pattern.test(data.content)) {
        return NextResponse.json(
          { error: 'Comments with links are not allowed to prevent spam. Please remove any URLs or website references.' },
          { status: 400 }
        )
      }
    }

    // Check for suspicious patterns in content
    const suspiciousPatterns = [
      /click\s+here/gi,
      /visit\s+my/gi,
      /check\s+out/gi,
      /free\s+money/gi,
      /make\s+money/gi,
      /earn\s+\$\d+/gi,
      /guaranteed/gi,
      /(buy|sell|discount|offer|deal)\s+(now|today)/gi
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(data.content)) {
        return NextResponse.json(
          { error: 'Your comment contains content that appears to be spam. Please revise your message.' },
          { status: 400 }
        )
      }
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(data.author_email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Website field not allowed to prevent spam
    if (data.author_website && data.author_website.trim()) {
      return NextResponse.json(
        { error: 'Website field is disabled to prevent spam.' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for moderation
    const headersList = headers()
    const userIP = headersList.get('x-forwarded-for') || 
                  headersList.get('x-real-ip') || 
                  request.ip || 
                  'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Prepare comment data
    const commentData = {
      post_id: postId,
      parent_id: data.parent_id || null,
      author_name: data.author_name.trim(),
      author_email: data.author_email.trim().toLowerCase(),
      author_website: data.author_website?.trim() || null,
      content: data.content.trim(),
      status: 'pending' as const, // All comments start as pending
      user_ip: userIP,
      user_agent: userAgent
    }

    console.log('Creating comment with data:', commentData)

    const commentId = await createComment(commentData)
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      id: commentId,
      message: 'Comment submitted successfully and is pending moderation'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}