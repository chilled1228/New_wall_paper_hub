import { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { fetchWallpapers } from "@/lib/wallpapers"

export const metadata: Metadata = {
  title: "Popular Wallpapers - Most Liked & Viewed",
  description: "Discover the most popular wallpapers based on likes and views. Trending designs loved by our community.",
}

export default async function PopularPage() {
  // Fetch all wallpapers
  const allWallpapers = await fetchWallpapers({ limit: 100 })
  
  // Sort by popularity (likes + views)
  const popularWallpapers = allWallpapers.sort((a, b) => {
    const popularityA = (a.likes || 0) + (a.views || 0)
    const popularityB = (b.likes || 0) + (b.views || 0)
    return popularityB - popularityA
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Popular Wallpapers
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the most loved and viewed wallpapers in our collection. Trending designs loved by our community.
          </p>
        </div>

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {popularWallpapers.map((wallpaper, index) => (
            <Card key={wallpaper.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={wallpaper.image_url}
                  alt={wallpaper.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                
                {/* Popularity Rank Badge */}
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold">
                  #{index + 1}
                </Badge>
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/wallpaper/${wallpaper.id}`}>
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
                    <Link href={`/wallpaper/${wallpaper.id}`}>
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
        {popularWallpapers.length === 0 && (
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
