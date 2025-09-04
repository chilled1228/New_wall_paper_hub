import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import { generateWallpaperSlug } from "@/lib/slug-utils"
import { OptimizedImage } from "./optimized-image"

// Helper function to format numbers for display
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Helper function to add real stats to wallpapers
async function addRealStats(wallpapers: any[]): Promise<WallpaperWithStats[]> {
  if (!wallpapers.length) return []
  
  // Get all wallpaper IDs
  const wallpaperIds = wallpapers.map(w => w.id)
  
  // Fetch stats for all wallpapers in one query
  const { data: allStats } = await supabase
    .from('wallpaper_stats')
    .select('*')
    .in('wallpaper_id', wallpaperIds)

  // Create a map of stats by wallpaper_id for quick lookup
  const statsMap = new Map()
  allStats?.forEach(stat => {
    statsMap.set(stat.wallpaper_id, stat)
  })

  // Add stats to each wallpaper
  return wallpapers.map(wallpaper => {
    const stats = statsMap.get(wallpaper.id)
    const downloads = stats?.downloads || 0
    const likes = stats?.likes || 0
    const views = stats?.views || 0
    
    return {
      ...wallpaper,
      stats,
      downloads: formatNumber(downloads),
      likes: formatNumber(likes),
      views: formatNumber(views),
      featured: views > 100,
      resolutions: [
        { label: "HD (720p)", width: 720, height: 1280, size: "1.2 MB" },
        { label: "Full HD (1080p)", width: 1080, height: 1920, size: "2.8 MB" },
        { label: "2K (1440p)", width: 1440, height: 2560, size: "4.5 MB" },
        { label: "4K (2160p)", width: 2160, height: 3840, size: "8.2 MB" },
      ],
      colors: ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"],
      uploadDate: wallpaper.created_at?.split('T')[0] || "2024-01-01",
      author: "WallpaperHub"
    }
  })
}

export async function AllWallpapers() {
  // Fetch wallpapers directly from Supabase instead of making HTTP requests
  const { data: wallpapers, error } = await supabase
    .from('wallpapers')
    .select('*')
    .limit(100)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching wallpapers:', error)
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">All Wallpapers</h2>
          <p className="text-muted-foreground">Unable to load wallpapers at this time.</p>
        </div>
      </section>
    )
  }

  // Filter out invalid entries
  const allWallpapers = (wallpapers || [])
    .filter(wallpaper => wallpaper.id && wallpaper.title && wallpaper.image_url)
  
  // Sort by creation date (newest first)
  const sortedWallpapers = allWallpapers.sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">All Wallpapers</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our complete collection of wallpapers, from newest to oldest
          </p>
          <div className="flex items-center justify-center mt-4 text-primary">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-medium">Sorted by newest first</span>
          </div>
        </div>

        {/* Wallpapers Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {sortedWallpapers.map((wallpaper) => (
            <Link key={wallpaper.id} href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  {/* Image Container - Mobile First */}
                  <div className="relative aspect-[9/16] sm:aspect-[3/4] overflow-hidden">
                    <img
                      src={wallpaper.image_url || "/placeholder.svg"}
                      alt={wallpaper.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Category Badge - Top Right on Mobile */}
                    <Badge className="absolute top-2 right-2 bg-black/60 text-white text-xs border-0">
                      {wallpaper.category}
                    </Badge>

                    {/* Simple overlay for desktop hover */}
                    <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Tap to View & Download
                      </div>
                    </div>
                  </div>

                  {/* Content - Minimal for Mobile */}
                  <div className="p-2 sm:p-3">
                    <h3 className="font-medium text-sm sm:text-base truncate mb-1">{wallpaper.title}</h3>
                    
                    {/* Stats - Hidden on small mobile, shown on larger screens */}
                    <div className="hidden sm:flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{wallpaper.downloads}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{wallpaper.likes}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Show total count */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Showing {sortedWallpapers.length} wallpapers
          </p>
        </div>
      </div>
    </section>
  )
}
