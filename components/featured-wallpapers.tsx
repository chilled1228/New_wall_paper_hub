import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye } from "lucide-react"
import Link from "next/link"
import { fetchFeaturedWallpapers } from "@/lib/wallpapers"
import { generateWallpaperSlug } from "@/lib/slug-utils"

export async function FeaturedWallpapers() {
  const featuredWallpapers = await fetchFeaturedWallpapers(4)
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Wallpapers</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hand-picked premium wallpapers that showcase the best of our collection
          </p>
        </div>

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredWallpapers.map((wallpaper) => (
            <Link key={wallpaper.id} href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}>
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

                    {/* Featured Badge */}
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">Featured</Badge>

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

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Featured
          </Button>
        </div>
      </div>
    </section>
  )
}
