import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json()
    
    // Check for secret to confirm this is a legitimate request
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
    }

    // Revalidate the blog pages
    revalidatePath('/blog')
    revalidatePath('/blog/[slug]', 'page')

    return NextResponse.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString() 
    })
  } catch (err) {
    return NextResponse.json({ 
      message: 'Error revalidating', 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Allow GET requests for manual triggering
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
    
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
    }

    revalidatePath('/blog')
    revalidatePath('/blog/[slug]', 'page')

    return NextResponse.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString() 
    })
  } catch (err) {
    return NextResponse.json({ 
      message: 'Error revalidating', 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 })
  }
}