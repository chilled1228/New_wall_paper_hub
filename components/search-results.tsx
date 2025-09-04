"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Grid3X3, List, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WallpaperWithStats } from "@/lib/database.types"
import Link from "next/link"
import { generateWallpaperSlug } from "@/lib/slug-utils"
import { WallpaperInteractions } from "./wallpaper-interactions"
import { OptimizedImage } from "./optimized-image"

interface SearchResultsProps {
  query: string
  filters: {
    category: string
    resolution: string
    orientation: string
    color: string
    sortBy: string
  }
}

interface SearchResponse {
  wallpapers: WallpaperWithStats[]
  totalCount: number
  hasMore: boolean
  query: string | null
  filters: any
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [resultsPerPage, setResultsPerPage] = useState("24")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (query) searchParams.append('q', query)
        if (filters.category) searchParams.append('category', filters.category)
        if (filters.resolution) searchParams.append('resolution', filters.resolution)
        if (filters.orientation) searchParams.append('orientation', filters.orientation)
        if (filters.color) searchParams.append('color', filters.color)
        if (filters.sortBy) searchParams.append('sort', filters.sortBy)
        searchParams.append('limit', resultsPerPage)

        const response = await fetch(`/api/search?${searchParams}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch search results')
        }

        setSearchResults(data)
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'Failed to search wallpapers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, filters, resultsPerPage])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Searching wallpapers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Search Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const results = searchResults?.wallpapers || []

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {results.length} wallpapers found
            {query && <span className="text-muted-foreground"> for "{query}"</span>}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sorted by {filters.sortBy === "popular" ? "most popular" : filters.sortBy}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Results per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={resultsPerPage} onValueChange={setResultsPerPage}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
                <SelectItem value="96">96</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View mode toggle */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* No Results */}
      {results.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No wallpapers found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button variant="outline">Clear all filters</Button>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {results.map((wallpaper) => (
            <Link
              key={wallpaper.id}
              href={`/wallpaper/${generateWallpaperSlug(wallpaper.id, wallpaper.title)}`}
            >
              <Card
                className={`group overflow-hidden hover:shadow-lg transition-all duration-300 ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                <CardContent className={`p-0 ${viewMode === "list" ? "flex w-full" : ""}`}>
                  {/* Image Container */}
                  <div
                    className={`relative overflow-hidden ${
                      viewMode === "list" ? "w-32 h-32 flex-shrink-0" : "aspect-[3/4]"
                    }`}
                  >
                    <OptimizedImage
                      src={wallpaper.image_url || "/placeholder.svg"}
                      thumbnailSrc={wallpaper.thumbnail_url || undefined}
                      mediumSrc={wallpaper.medium_url || undefined}
                      largeSrc={wallpaper.large_url || undefined}
                      originalSrc={wallpaper.original_url || undefined}
                      alt={wallpaper.title}
                      fill
                      className="group-hover:scale-105 transition-transform duration-300"
                      sizes={viewMode === "list" ? "128px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Simple overlay for desktop hover */}
                    <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Tap to View & Download
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-base truncate">{wallpaper.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {wallpaper.category}
                      </Badge>
                    </div>

                    {viewMode === "list" && (
                      <div className="flex items-center gap-2 mb-2">
                        {wallpaper.tags?.includes('4K') && (
                          <Badge variant="secondary" className="text-xs">4K</Badge>
                        )}
                        {wallpaper.tags?.includes('2K') && (
                          <Badge variant="secondary" className="text-xs">2K</Badge>
                        )}
                        {wallpaper.tags?.includes('portrait') && (
                          <Badge variant="secondary" className="text-xs">Portrait</Badge>
                        )}
                      </div>
                    )}

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
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{wallpaper.views}</span>
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

      {/* Load More */}
      {searchResults?.hasMore && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg">
            Load More Wallpapers
          </Button>
        </div>
      )}
    </div>
  )
}
