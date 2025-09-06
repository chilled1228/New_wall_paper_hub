"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import NProgress from "nprogress"

// Configure NProgress for faster, less intrusive loading
NProgress.configure({
  showSpinner: false,
  speed: 300,        // Faster animation
  minimum: 0.1,      // Start immediately 
  trickleSpeed: 100, // Faster trickle
  easing: 'ease',
  positionUsing: 'translate3d'
})

export function LoadingBar() {
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Start progress bar immediately on route change
    NProgress.start()

    // Complete progress bar quickly when component mounts
    timeoutRef.current = setTimeout(() => {
      NProgress.done()
    }, 50) // Reduced from 100ms to 50ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      NProgress.done()
    }
  }, [pathname])

  return null
}

// Hook to manually control loading bar
export function useLoadingBar() {
  return {
    start: () => NProgress.start(),
    done: () => NProgress.done(),
    inc: () => NProgress.inc(),
    set: (percentage: number) => NProgress.set(percentage),
  }
}