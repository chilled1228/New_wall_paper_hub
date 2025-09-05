import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"
import Link from "next/link"
import { fetchPopularWallpapers } from "@/lib/wallpapers"
import { WallpaperCard } from "@/components/wallpaper-card"
export async function PopularWallpapers() {
  const popularWallpapers = await fetchPopularWallpapers(6)
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/60" />
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent font-poppins">
                Popular This Week
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl font-roboto">
              Most downloaded wallpapers by our community - trending now
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-3 bg-primary/10 px-4 py-2 border border-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary font-poppins">Trending</span>
          </div>
        </div>

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularWallpapers.map((wallpaper, index) => (
            <WallpaperCard 
              key={wallpaper.id}
              wallpaper={wallpaper}
              variant="default"
              showRank={true}
              rank={index + 1}
              priority={index < 3}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-16">
          <Link href="/popular">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-poppins"
            >
              View All Popular Wallpapers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
