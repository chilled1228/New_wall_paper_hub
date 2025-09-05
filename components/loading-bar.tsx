"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import NProgress from "nprogress"

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  speed: 500,
  minimum: 0.3,
  trickleSpeed: 200,
})

export function LoadingBar() {
  const pathname = usePathname()

  useEffect(() => {
    // Start progress bar on route change
    NProgress.start()

    // Complete progress bar when component mounts (page load complete)
    const timer = setTimeout(() => {
      NProgress.done()
    }, 100)

    return () => {
      clearTimeout(timer)
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