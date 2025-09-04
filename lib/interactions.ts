// Client-side utility for tracking user interactions

// Generate a session ID for anonymous users
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-side'
  
  let sessionId = localStorage.getItem('wallpaper-session-id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
    localStorage.setItem('wallpaper-session-id', sessionId)
  }
  return sessionId
}

// Track user interaction
export async function trackInteraction(
  wallpaperId: string, 
  interactionType: 'view' | 'like' | 'download'
): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const sessionId = getSessionId()
    
    const response = await fetch('/api/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallpaper_id: wallpaperId,
        interaction_type: interactionType,
        session_id: sessionId,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to track interaction' }
    }

    return { success: true, stats: data.stats }
  } catch (error) {
    console.error('Error tracking interaction:', error)
    return { success: false, error: 'Network error' }
  }
}

// Get wallpaper stats
export async function getWallpaperStats(wallpaperId: string) {
  try {
    const response = await fetch(`/api/wallpapers/${wallpaperId}/stats`)
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching wallpaper stats:', error)
    return { downloads: 0, likes: 0, views: 0 }
  }
}

// Format numbers for display
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Check if user has already liked a wallpaper (client-side tracking)
export function hasUserLiked(wallpaperId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const likedWallpapers = JSON.parse(localStorage.getItem('liked-wallpapers') || '[]')
  return likedWallpapers.includes(wallpaperId)
}

// Mark wallpaper as liked (client-side tracking)
export function markWallpaperAsLiked(wallpaperId: string): void {
  if (typeof window === 'undefined') return
  
  const likedWallpapers = JSON.parse(localStorage.getItem('liked-wallpapers') || '[]')
  if (!likedWallpapers.includes(wallpaperId)) {
    likedWallpapers.push(wallpaperId)
    localStorage.setItem('liked-wallpapers', JSON.stringify(likedWallpapers))
  }
}

// Remove wallpaper from liked list (client-side tracking)
export function unmarkWallpaperAsLiked(wallpaperId: string): void {
  if (typeof window === 'undefined') return
  
  const likedWallpapers = JSON.parse(localStorage.getItem('liked-wallpapers') || '[]')
  const index = likedWallpapers.indexOf(wallpaperId)
  if (index > -1) {
    likedWallpapers.splice(index, 1)
    localStorage.setItem('liked-wallpapers', JSON.stringify(likedWallpapers))
  }
}