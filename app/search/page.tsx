"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Heart, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { generateWallpaperSlug } from "@/lib/slug-utils"

interface WallpaperResult {
  id: string
  title: string
  category: string
  image_url: string
  medium_url?: string
  large_url?: string
  thumbnail_url?: string
  downloads: string
  likes: string
  views: string
}

interface SearchResponse {
  wallpapers: WallpaperResult[]
  totalCount: number
  hasMore: boolean
  query: string | null
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<WallpaperResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [totalCount, setTotalCount] = useState(0)

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setTotalCount(0)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=24`)
      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data.wallpapers || [])
      setTotalCount(data.totalCount || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const query = searchQuery.trim()
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      performSearch(query)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {/* Search Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 font-poppins">
              {initialQuery ? `Search Results` : "Search Wallpapers"}
            </h1>
            
            {initialQuery && (
              <p className="text-muted-foreground mb-6">
                Found {totalCount} wallpapers for "{initialQuery}"
              </p>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for wallpapers, categories, colors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-12 h-14 text-lg rounded-full border-2"
              />
              <Button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6"
                size="sm"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Searching wallpapers...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">❌ {error}</div>
              <Button variant="outline" onClick={() => performSearch(searchQuery)}>
                Try Again
              </Button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && initialQuery && results.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No wallpapers found</h3>
              <p className="text-muted-foreground mb-6">
                Try different keywords or browse our categories instead
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  nature
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  abstract
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  minimalist
                </Badge>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
              {results.map((wallpaper) => (
                <Link 
                  key={wallpaper.id} 
                  href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[9/16] overflow-hidden bg-muted relative rounded-lg">
                    <Image
                      src={wallpaper.medium_url || wallpaper.image_url || "/placeholder.svg"}
                      alt={`${wallpaper.title} - ${wallpaper.category} wallpaper`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      quality={85}
                    />
                    
                    {/* Overlay with stats */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {wallpaper.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {wallpaper.likes}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {wallpaper.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {wallpaper.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {wallpaper.downloads} downloads
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
