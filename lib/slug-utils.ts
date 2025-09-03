import { WallpaperWithStats } from './database.types'

// Generate SEO-friendly slug from wallpaper data
export function generateWallpaperSlug(wallpaper: { id: string; title: string; category: string }): string {
  // Clean and format the title for URL
  const cleanTitle = wallpaper.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .substring(0, 50) // Limit length for SEO

  // Clean category
  const cleanCategory = wallpaper.category
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  // Format: category-title-id (last 8 chars for uniqueness)
  const shortId = wallpaper.id.slice(-8)
  
  return `${cleanCategory}-${cleanTitle}-${shortId}`
}

// Extract ID from slug
export function extractIdFromSlug(slug: string): string | null {
  // Extract the last 8 characters (the short ID)
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  if (lastPart && lastPart.length === 8) {
    return lastPart
  }
  
  return null
}

// Find wallpaper by slug
export async function findWallpaperBySlug(slug: string): Promise<{ id: string } | null> {
  const shortId = extractIdFromSlug(slug)
  if (!shortId) return null

  // Import supabase here to avoid circular dependencies
  const { supabase } = await import('./supabase')
  
  // Query all wallpapers and filter by short ID in JavaScript to avoid PostgreSQL UUID operator issues
  const { data: wallpapers, error } = await supabase
    .from('wallpapers')
    .select('id')
  
  if (error || !wallpapers) {
    return null
  }
  
  // Filter for wallpapers whose ID ends with the short ID
  const matchingWallpapers = wallpapers.filter(w => w.id.endsWith(shortId))
  
  if (matchingWallpapers.length === 0) {
    return null
  }
  
  return matchingWallpapers[0]
}

// Generate canonical slug for existing wallpaper (for redirects)
export function generateCanonicalSlug(wallpaper: WallpaperWithStats): string {
  return generateWallpaperSlug(wallpaper)
}

// Validate if slug format is correct
export function isValidSlugFormat(slug: string): boolean {
  // Check if slug ends with 8-character ID and has proper format
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  
  return (
    parts.length >= 3 && // minimum: category-title-id
    lastPart.length === 8 &&
    /^[a-z0-9-]+$/.test(slug) // only lowercase letters, numbers, and hyphens
  )
}