import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { fetchWallpapers } from "@/lib/wallpapers"

export async function AllWallpapers() {
  // Fetch all wallpapers without any filters
  const allWallpapers = await fetchWallpapers({ limit: 100 })
  
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
