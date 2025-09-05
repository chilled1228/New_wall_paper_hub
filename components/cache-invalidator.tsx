'use client'

import { useEffect } from 'react'

export default function CacheInvalidator() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered:', registration.scope)
        
        // Clear webpack cache on hot reload
        if (process.env.NODE_ENV === 'development') {
          const clearCache = () => {
            if (registration.active) {
              registration.active.postMessage({ type: 'CLEAR_WEBPACK_CACHE' })
            }
          }
          
          // Clear cache on visibility change (tab switch)
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              clearCache()
            }
          })
          
          // Clear cache periodically in development
          const interval = setInterval(clearCache, 30000)
          return () => clearInterval(interval)
        }
      }).catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
    }
  }, [])

  return null
}