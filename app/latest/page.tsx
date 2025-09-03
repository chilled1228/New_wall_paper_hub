import { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import { generateWallpaperSlug } from "@/lib/slug-utils"

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

export const metadata: Metadata = {
  title: "Latest Wallpapers - Newest Uploads",
  description: "Discover the latest and newest wallpapers uploaded to our collection. Fresh designs updated daily.",
}

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LatestPage() {
  // Fetch wallpapers directly from Supabase instead of making HTTP requests
  const { data: wallpapers, error } = await supabase
    .from('wallpapers')
    .select('*')
    .limit(100)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching wallpapers:', error)
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Latest Wallpapers</h1>
          <p className="text-muted-foreground">Unable to load wallpapers at this time.</p>
        </div>
      </div>
    )
  }

  // Add mock stats and filter out invalid entries
  const latestWallpapers = (wallpapers || [])
    .filter(wallpaper => wallpaper.id && wallpaper.title && wallpaper.image_url)
    .map(wallpaper => addMockStats(wallpaper))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Latest Wallpapers
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the newest wallpapers added to our collection. Fresh designs updated daily.
          </p>
        </div>

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {latestWallpapers.map((wallpaper) => (
            <Card key={wallpaper.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={wallpaper.image_url}
                  alt={wallpaper.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <a href={wallpaper.image_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Category Badge */}
                {wallpaper.category && (
                  <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                    {wallpaper.category}
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
                  {wallpaper.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(wallpaper.created_at || 0).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {wallpaper.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {wallpaper.likes || 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={wallpaper.image_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {latestWallpapers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No Wallpapers Yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to upload a beautiful wallpaper to our collection!
            </p>
            <Button asChild>
              <Link href="/upload">Upload Wallpaper</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
