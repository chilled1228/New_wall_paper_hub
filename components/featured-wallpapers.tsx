import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Link from "next/link"
import { fetchFeaturedWallpapers } from "@/lib/wallpapers"
import { WallpaperCard } from "@/components/wallpaper-card"

export async function FeaturedWallpapers() {
  const featuredWallpapers = await fetchFeaturedWallpapers(4)
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-muted/20 via-background to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Star className="h-8 w-8 text-primary fill-primary" />
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Featured Wallpapers
            </h2>
            <Star className="h-8 w-8 text-primary fill-primary" />
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hand-picked premium wallpapers that showcase the absolute best of our collection
          </p>
        </div>

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredWallpapers.map((wallpaper) => (
            <WallpaperCard 
              key={wallpaper.id}
              wallpaper={wallpaper}
              variant="featured"
              priority={true}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-16">
          <Link href="/featured">
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Explore All Featured Wallpapers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
