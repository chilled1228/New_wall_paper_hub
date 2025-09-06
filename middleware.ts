import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  
  // Add performance headers for all requests
  response.headers.set('X-Response-Time', Date.now().toString())
  
  // Add compression hints
  if (request.headers.get('accept-encoding')?.includes('br')) {
    response.headers.set('Content-Encoding', 'br')
  } else if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip')
  }
  
  // Performance optimizations for static assets
  if (pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Homepage performance optimization
  if (pathname === '/') {
    response.headers.set('X-Homepage-Optimized', 'true')
  }
  
  // Preload critical resources for wallpaper pages
  if (pathname.startsWith('/wallpaper/')) {
    response.headers.set('Link', '</font/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin=anonymous')
  }
  
  // Temporarily disable auth for demo - just pass through with performance headers
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}