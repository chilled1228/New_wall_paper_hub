const CACHE_NAME = 'wallpaper-app-v2'
const STATIC_CACHE_NAME = 'wallpaper-static-v2'
const IMAGES_CACHE_NAME = 'wallpaper-images-v1'
const API_CACHE_NAME = 'wallpaper-api-v1'
const FONTS_CACHE_NAME = 'wallpaper-fonts-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html', // Fallback offline page
]

const API_ENDPOINTS = [
  '/api/wallpapers',
  '/api/blog/posts',
  '/api/blog/categories'
]

const WEBPACK_CHUNKS_PATTERN = /_next\/static\/chunks\//
const IMAGES_PATTERN = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i
const FONTS_PATTERN = /\.(woff|woff2|eot|ttf|otf)$/i
const API_PATTERN = /\/api\//

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      // Pre-cache critical resources
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/_next/static/css/',
          '/_next/static/js/',
        ]).catch(() => {
          // Ignore errors for non-existent assets
        })
      })
    ])
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const validCaches = [
        CACHE_NAME,
        STATIC_CACHE_NAME,
        IMAGES_CACHE_NAME,
        API_CACHE_NAME,
        FONTS_CACHE_NAME
      ]
      
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (!validCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName)
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

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Handle webpack chunks specially to prevent caching issues
  if (WEBPACK_CHUNKS_PATTERN.test(url.pathname)) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then(response => {
          // Cache successful webpack responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cached version if network fails
          return caches.match(request)
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response
        }
        
        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Handle images with cache-first strategy and long-term storage
  if (IMAGES_PATTERN.test(url.pathname) || url.pathname.includes('/image')) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response
        }
        
        return fetch(request).then(response => {
          if (response.ok && response.headers.get('content-type')?.includes('image')) {
            const responseClone = response.clone()
            caches.open(IMAGES_CACHE_NAME).then(cache => {
              // Cache images for 30 days
              const headers = new Headers(response.headers)
              headers.set('sw-cached-at', Date.now().toString())
              const cachedResponse = new Response(responseClone.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
              })
              cache.put(request, cachedResponse)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Handle fonts with cache-first strategy
  if (FONTS_PATTERN.test(url.pathname) || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response
        }
        
        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(FONTS_CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Handle API requests with network-first strategy and short-term caching
  if (API_PATTERN.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone()
            caches.open(API_CACHE_NAME).then(cache => {
              // Cache API responses for 5 minutes
              const headers = new Headers(response.headers)
              headers.set('sw-cached-at', Date.now().toString())
              headers.set('sw-cache-ttl', '300000') // 5 minutes
              const cachedResponse = new Response(responseClone.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
              })
              cache.put(request, cachedResponse)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              const cachedAt = parseInt(cachedResponse.headers.get('sw-cached-at') || '0')
              const ttl = parseInt(cachedResponse.headers.get('sw-cache-ttl') || '300000')
              
              // Check if cached response is still valid
              if (Date.now() - cachedAt < ttl) {
                return cachedResponse
              }
            }
            // Return offline response for API failures
            return new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
    )
    return
  }

  // Handle navigation requests (pages) with network-first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Try cache first
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Fallback to offline page
            return caches.match('/offline.html') || 
              new Response('<h1>Offline</h1><p>Please check your internet connection.</p>', {
                headers: { 'Content-Type': 'text/html' }
              })
          })
        })
    )
    return
  }

  // Default: network-first with cache fallback for all other requests
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Enhanced message handler with cache management
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
  
  if (event.data && event.data.type === 'CLEAR_ALL_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }).then(() => {
      event.ports[0]?.postMessage({ success: true })
    })
  }
  
  if (event.data && event.data.type === 'CACHE_SIZE') {
    calculateCacheSize().then(size => {
      event.ports[0]?.postMessage({ cacheSize: size })
    })
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'wallpaper-download') {
    event.waitUntil(syncWallpaperDownloads())
  }
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics())
  }
})

// Push notifications for new wallpapers
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/'
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
    )
  }
})

// Utility functions
async function calculateCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}

async function syncWallpaperDownloads() {
  // Sync pending wallpaper downloads when back online
  try {
    const pendingDownloads = await getStoredData('pendingDownloads')
    if (pendingDownloads && pendingDownloads.length > 0) {
      for (const download of pendingDownloads) {
        await fetch(`/api/wallpapers/${download.id}/download`, {
          method: 'POST'
        })
      }
      await clearStoredData('pendingDownloads')
    }
  } catch (error) {
    console.error('Error syncing wallpaper downloads:', error)
  }
}

async function syncAnalytics() {
  // Sync pending analytics events when back online
  try {
    const pendingEvents = await getStoredData('pendingAnalytics')
    if (pendingEvents && pendingEvents.length > 0) {
      for (const event of pendingEvents) {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        })
      }
      await clearStoredData('pendingAnalytics')
    }
  } catch (error) {
    console.error('Error syncing analytics:', error)
  }
}

async function getStoredData(key) {
  return new Promise((resolve) => {
    // Use IndexedDB for larger data storage
    // Simplified version - in production, use a proper IndexedDB wrapper
    resolve([])
  })
}

async function clearStoredData(key) {
  return new Promise((resolve) => {
    // Clear stored data
    resolve()
  })
}