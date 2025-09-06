import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { WallpaperWithStats } from "@/lib/database.types"
import { generateWallpaperSlug } from "@/lib/slug-utils"

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

export async function SimpleGallery() {
  // Fetch all wallpapers directly from Supabase
  const { data: wallpapers, error } = await supabase
    .from('wallpapers')
    .select('*')
    .limit(100)
    .order('created_at', { ascending: false })
  
  if (error || !wallpapers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Unable to load wallpapers</p>
      </div>
    )
  }

  // Filter and add stats
  const filteredWallpapers = wallpapers.filter(w => w.id && w.title && w.image_url)
  const wallpapersWithStats = await addRealStats(filteredWallpapers)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
        {wallpapersWithStats.map((wallpaper) => {
          const slug = generateWallpaperSlug(wallpaper)
          
          return (
            <Link key={wallpaper.id} href={`/wallpaper/${slug}`}>
              <div className="group cursor-pointer">
                <div className="aspect-[9/16] overflow-hidden bg-muted relative">
                  <Image
                    src={wallpaper.medium_url || wallpaper.image_url || "/placeholder.svg"}
                    alt={`${wallpaper.title} - Mobile wallpaper in ${wallpaper.category} category`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    quality={85}
                  />
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {wallpaper.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {wallpaper.downloads} downloads
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}