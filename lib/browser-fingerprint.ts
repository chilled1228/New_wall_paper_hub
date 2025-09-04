'use client'

// Generate a unique browser fingerprint for anonymous user tracking
export function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('Browser fingerprint', 10, 50)
  const canvasFingerprint = canvas.toDataURL()

  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    canvas: canvasFingerprint.slice(-50), // Last 50 chars for size
  }

  // Create hash from fingerprint
  const fingerprintString = JSON.stringify(fingerprint)
  let hash = 0
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36)
}

// Get or create a persistent user ID for this device
export function getDeviceUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  const storageKey = 'wallpaper_device_id'
  let deviceId = localStorage.getItem(storageKey)
  
  if (!deviceId) {
    // Generate new device ID combining fingerprint and random
    const fingerprint = generateBrowserFingerprint()
    const random = Math.random().toString(36).substr(2, 9)
    deviceId = `${fingerprint}_${random}_${Date.now().toString(36)}`
    localStorage.setItem(storageKey, deviceId)
  }
  
  return deviceId
}

// Check if user has liked a specific wallpaper
export function hasUserLikedWallpaper(wallpaperId: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const likedWallpapers = getLikedWallpapers()
  return likedWallpapers.includes(wallpaperId)
}

// Get all wallpapers liked by this device
export function getLikedWallpapers(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  const stored = localStorage.getItem('liked_wallpapers')
  return stored ? JSON.parse(stored) : []
}

// Add wallpaper to liked list
export function addLikedWallpaper(wallpaperId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const likedWallpapers = getLikedWallpapers()
  if (!likedWallpapers.includes(wallpaperId)) {
    likedWallpapers.push(wallpaperId)
    localStorage.setItem('liked_wallpapers', JSON.stringify(likedWallpapers))
  }
}

// Remove wallpaper from liked list (for unlike functionality)
export function removeLikedWallpaper(wallpaperId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const likedWallpapers = getLikedWallpapers()
  const index = likedWallpapers.indexOf(wallpaperId)
  if (index > -1) {
    likedWallpapers.splice(index, 1)
    localStorage.setItem('liked_wallpapers', JSON.stringify(likedWallpapers))
  }
}