import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"

// Helper function to add mock stats to wallpapers for UI compatibility
function addMockStats(wallpaper: any): WallpaperWithStats {
  // Generate consistent mock data based on wallpaper ID
  const id = wallpaper.id
  const hash = id.split('').reduce((a: number, b: string) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const downloads = Math.abs(hash % 50) + 5 // 5-55K downloads
  const likes = Math.abs(hash % 10) + 1 // 1-11K likes
  const views = downloads * 3 + Math.abs(hash % 20) // Views based on downloads
  
  return {
    ...wallpaper,
    downloads: `${downloads}.${Math.abs(hash % 10)}K`,
    likes: `${likes}.${Math.abs(hash % 10)}K`,
    views: `${views}.${Math.abs(hash % 10)}K`,
    featured: Math.abs(hash % 3) === 0, // ~33% chance of being featured
    resolutions: [
      { label: "HD (720p)", width: 720, height: 1280, size: "1.2 MB" },
      { label: "Full HD (1080p)", width: 1080, height: 1920, size: "2.8 MB" },
      { label: "2K (1440p)", width: 1440, height: 2560, size: "4.5 MB" },
      { label: "4K (2160p)", width: 2160, height: 3840, size: "8.2 MB" },
    ],
    colors: ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"], // Default colors
    uploadDate: wallpaper.created_at?.split('T')[0] || "2024-01-01",
    author: "WallpaperHub"
  }
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

  // Add mock stats for UI compatibility and filter out invalid entries
  const allWallpapers = (wallpapers || [])
    .filter(wallpaper => wallpaper.id && wallpaper.title && wallpaper.image_url)
    .map(wallpaper => addMockStats(wallpaper))
  
  // Sort by creation date (newest first)
  const sortedWallpapers = allWallpapers.sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedWallpapers.map((wallpaper) => (
            <Link key={wallpaper.id} href={`/wallpaper/${wallpaper.id}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={wallpaper.image_url || "/placeholder.svg"}
                      alt={wallpaper.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Upload Date Badge */}
                    <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs">
                      {wallpaper.created_at ? new Date(wallpaper.created_at).toLocaleDateString() : 'Recent'}
                    </Badge>

                    {/* Action Buttons */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex space-x-2">
                        <Button size="icon" variant="secondary" className="h-10 w-10">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-10 w-10">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="icon" className="h-10 w-10">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate">{wallpaper.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {wallpaper.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
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
