import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import { generateAltText } from "@/lib/seo-utils"
import { generateWallpaperSlug } from "@/lib/slug-utils"
import { OptimizedImage } from "./optimized-image"

interface RelatedWallpapersProps {
  currentWallpaper: WallpaperWithStats
}
export async function RelatedWallpapers({ currentWallpaper }: RelatedWallpapersProps) {
  // Fetch related wallpapers directly from Supabase with optimized query
  let relatedWallpapers: WallpaperWithStats[] = []
  
  try {
    // Only select the fields we actually need for better performance
    const { data: wallpapers, error } = await supabase
      .from('wallpapers')
      .select('id, title, category, description, image_url, thumbnail_url, medium_url, large_url, original_url, created_at')
      .eq('category', currentWallpaper.category)
      .neq('id', currentWallpaper.id) // Exclude current wallpaper
      .limit(8)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching related wallpapers:', error)
    } else {
      // Add minimal stats for display (we don't need full stats for related wallpapers)
      relatedWallpapers = (wallpapers || []).map(wallpaper => ({
        ...wallpaper,
        downloads: '0', // Will be loaded on-demand if needed
        likes: '0',
        views: '0',
        featured: false,
        stats: undefined,
        resolutions: [],
        colors: [],
        uploadDate: wallpaper.created_at?.split('T')[0] || "2024-01-01",
        author: "WallpaperHub",
        tags: [],
        description: wallpaper.description || '',
        original_url: wallpaper.original_url || wallpaper.large_url || wallpaper.image_url
      }))
    }
  } catch (error) {
    console.error('Error fetching related wallpapers:', error)
  }

  if (relatedWallpapers.length === 0) {
    return null
  }

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Related Wallpapers</h2>
            <p className="text-lg text-muted-foreground">More wallpapers you might like</p>
          </div>
          <Link href={`/categories/${currentWallpaper.category.toLowerCase()}`}>
            <Button variant="outline">View All {currentWallpaper.category}</Button>
          </Link>
        </div>

        {/* Related Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedWallpapers.map((wallpaper) => (
            <Link key={wallpaper.id} href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <OptimizedImage
                      src={wallpaper.image_url}
                      thumbnailSrc={wallpaper.thumbnail_url || undefined}
                      mediumSrc={wallpaper.medium_url || undefined}
                      largeSrc={wallpaper.large_url || undefined}
                      originalSrc={wallpaper.original_url || undefined}
                      alt={generateAltText(wallpaper, 'thumbnail')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={false}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Category Badge */}
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      {wallpaper.category}
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

        {/* View More */}
        <div className="text-center mt-12">
          <Link href={`/categories/${currentWallpaper.category.toLowerCase()}`}>
            <Button variant="outline" size="lg">
              Explore More {currentWallpaper.category} Wallpapers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
