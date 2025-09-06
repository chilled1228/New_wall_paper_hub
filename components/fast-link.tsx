"use client"

import { useRouter } from 'next/navigation'
import { useCallback, type MouseEvent } from 'react'

interface FastLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  replace?: boolean
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Optimized Link component that provides faster navigation
 * by using programmatic navigation instead of traditional anchors
 */
export function FastLink({ 
  href, 
  children, 
  className = '', 
  prefetch = true,
  replace = false,
  onClick 
}: FastLinkProps) {
  const router = useRouter()

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    // Call custom onClick if provided
    onClick?.(e)
    
    // Navigate programmatically for faster response
    if (replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
  }, [router, href, replace, onClick])

  // Prefetch the route on hover for even faster navigation
  const handleMouseEnter = useCallback(() => {
    if (prefetch) {
      router.prefetch(href)
    }
  }, [router, href, prefetch])

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter} // Also prefetch on mobile touch start
    >
      {children}
    </a>
  )
}