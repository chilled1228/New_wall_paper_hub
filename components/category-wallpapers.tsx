"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Heart, Eye, Grid3X3, List, Filter } from "lucide-react"
import { WallpaperWithStats } from "@/lib/database.types"

interface CategoryWallpapersProps {
  categorySlug: string
}

export function CategoryWallpapers({ categorySlug }: CategoryWallpapersProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const [filterBy, setFilterBy] = useState("all")
  const [wallpapers, setWallpapers] = useState<WallpaperWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/wallpapers?category=${categorySlug}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setWallpapers(data)
        }
      } catch (error) {
        console.error('Error fetching wallpapers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWallpapers()
  }, [categorySlug])

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">{wallpapers.length} wallpapers found</h2>
            <p className="text-muted-foreground">Sorted by {sortBy === "popular" ? "most popular" : sortBy}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="4k">4K Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="downloads">Most Downloaded</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
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

        {/* Wallpapers Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading wallpapers...</p>
            </div>
          </div>
        ) : wallpapers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No wallpapers found in this category.</p>
            <p className="text-sm text-muted-foreground mt-2">Try browsing other categories or check back later.</p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {wallpapers.map((wallpaper) => (
            <Card
              key={wallpaper.id}
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
                  <img
                    src={wallpaper.image_url || "/placeholder.svg"}
                    alt={wallpaper.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                  {/* Featured Badge */}
                  {wallpaper.featured && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">Featured</Badge>
                  )}

                  {/* Resolution Badge */}
                  <Badge className="absolute top-3 right-3 bg-black/50 text-white border-0">
                    {wallpaper.resolutions?.[wallpaper.resolutions.length - 1]?.label || "HD"}
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
                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base truncate">{wallpaper.title}</h3>
                  </div>

                  {viewMode === "list" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {wallpaper.resolutions?.[wallpaper.resolutions.length - 1]?.label || "HD"}
                      </Badge>
                      {wallpaper.featured && (
                        <Badge variant="default" className="text-xs">
                          Featured
                        </Badge>
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Load More */}
        {!loading && wallpapers.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Wallpapers
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
