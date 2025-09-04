import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import { generateWallpaperSlug } from "@/lib/slug-utils"


interface CategoryWallpapersProps {
  categorySlug: string
}

export async function CategoryWallpapers({ categorySlug }: CategoryWallpapersProps) {
  // Fetch wallpapers directly from Supabase for real-time data
  const { data: wallpapers, error } = await supabase
    .from('wallpapers')
    .select('*')
    .eq('category', categorySlug)
    .limit(50)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching wallpapers:', error)
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Unable to load wallpapers at this time.</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later.</p>
          </div>
        </div>
      </section>
    )
  }

  // Add mock stats and filter out invalid entries
  const categoryWallpapers = (wallpapers || [])
    .filter(wallpaper => wallpaper.id && wallpaper.title && wallpaper.image_url)

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {categoryWallpapers.length} wallpaper{categoryWallpapers.length !== 1 ? 's' : ''} found
          </h2>
          <p className="text-muted-foreground">Sorted by newest first</p>
        </div>

        {/* Wallpapers Grid */}
        {categoryWallpapers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-semibold mb-2">No Wallpapers Yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to upload a wallpaper in this category!
            </p>
            <Button asChild>
              <Link href="/upload">Upload Wallpaper</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryWallpapers.map((wallpaper) => (
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
                      {wallpaper.featured && (
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                          Featured
                        </Badge>
                      )}

                      {/* Upload Date Badge */}
                      <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground text-xs">
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
                        <h3 className="font-semibold text-base truncate">{wallpaper.title}</h3>
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
        )}
      </div>
    </section>
  )
}
