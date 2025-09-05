import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import { WallpaperCard } from "@/components/wallpaper-card"

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
  
  // Add stats to wallpapers
  const wallpapersWithStats = await addRealStats(allWallpapers)
  
  // Sort by creation date (newest first)
  const sortedWallpapers = wallpapersWithStats.sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              All Wallpapers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our complete collection of stunning wallpapers, freshly updated
            </p>
          </div>
          <div className="flex items-center justify-center mt-6 text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 w-fit mx-auto">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-medium">Sorted by newest first</span>
          </div>
        </div>

        {/* Wallpapers Grid - Responsive Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {sortedWallpapers.map((wallpaper, index) => (
            <WallpaperCard 
              key={wallpaper.id}
              wallpaper={wallpaper}
              variant="compact"
              priority={index < 10}
            />
          ))}
        </div>

        {/* Statistics and Load More */}
        <div className="text-center mt-16 space-y-6">
          <div className="bg-muted/50 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-lg font-semibold text-foreground mb-2">
              {sortedWallpapers.length} Beautiful Wallpapers
            </p>
            <p className="text-sm text-muted-foreground">
              Updated daily with fresh content
            </p>
          </div>
          
          <Button 
            size="lg" 
            variant="outline"
            className="px-8 py-3 rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            Load More Wallpapers
          </Button>
        </div>
      </div>
    </section>
  )
}
