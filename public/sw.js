const CACHE_NAME = 'wallpaper-app-v1'
const STATIC_CACHE_NAME = 'wallpaper-static-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

const WEBPACK_CHUNKS_PATTERN = /_next\/static\/chunks\//

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle webpack chunks specially to prevent caching issues
  if (WEBPACK_CHUNKS_PATTERN.test(url.pathname)) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' }).catch(() => {
        return caches.match(request)
      })
    )
    return
  }

  // Handle static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Default fetch strategy
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    })
  )
})

// Clear webpack chunk cache on message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_WEBPACK_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        if (cacheName.includes('webpack') || cacheName.includes('chunk')) {
          caches.delete(cacheName)
        }
      })
    })
  }
})