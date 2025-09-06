"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import NProgress from "nprogress"

// Configure NProgress for realistic loading experience
NProgress.configure({
  showSpinner: false,
  speed: 400,        // Moderate speed for better UX
  minimum: 0.08,     // Start immediately but realistically
  trickleSpeed: 200, // More natural trickle
  easing: 'ease-out',
  positionUsing: 'translate3d'
})

export function LoadingBar() {
  const pathname = usePathname()
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const intervalRef = useRef<NodeJS.Timeout>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Clear any existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearTimeout(intervalRef.current)

    // Start loading
    setIsLoading(true)
    NProgress.start()

    // Simulate realistic loading progression
    let progress = 0.08
    intervalRef.current = setInterval(() => {
      progress += Math.random() * 0.1
      if (progress < 0.9) {
        NProgress.set(progress)
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }, 100)

    // Complete after DOM is ready
    const completeLoading = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      NProgress.done()
      setIsLoading(false)
    }

    // Use multiple indicators for completion
    // 1. Immediate completion for cached routes
    if (document.readyState === 'complete') {
      timeoutRef.current = setTimeout(completeLoading, 200)
    } else {
      // 2. Wait for DOM content loaded
      const handleDOMLoaded = () => completeLoading()
      const handleLoad = () => completeLoading()
      
      document.addEventListener('DOMContentLoaded', handleDOMLoaded, { once: true })
      window.addEventListener('load', handleLoad, { once: true })
      
      // 3. Fallback timeout for slow pages
      timeoutRef.current = setTimeout(completeLoading, 3000)
      
      return () => {
        document.removeEventListener('DOMContentLoaded', handleDOMLoaded)
        window.removeEventListener('load', handleLoad)
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
      NProgress.done()
      setIsLoading(false)
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