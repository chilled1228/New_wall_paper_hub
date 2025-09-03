"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Heart, Eye, Grid3X3, List, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WallpaperWithStats } from "@/lib/database.types"

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

const mockResults = [
  {
    id: 1,
    title: "Mountain Sunrise",
    category: "Nature",
    downloads: "12.5K",
    likes: "2.1K",
    image: "/mountain-sunrise-landscape-mobile-wallpaper.png",
    resolution: "4K",
    orientation: "portrait",
    colors: ["orange", "blue"],
  },
  {
    id: 2,
    title: "Abstract Waves",
    category: "Abstract",
    downloads: "8.3K",
    likes: "1.8K",
    image: "/abstract-colorful-waves-mobile-wallpaper.png",
    resolution: "2K",
    orientation: "portrait",
    colors: ["purple", "blue"],
  },
  {
    id: 3,
    title: "Minimalist Geometry",
    category: "Minimalist",
    downloads: "15.2K",
    likes: "3.4K",
    image: "/minimalist-geometric-shapes-mobile-wallpaper.png",
    resolution: "4K",
    orientation: "portrait",
    colors: ["white", "black"],
  },
  {
    id: 4,
    title: "Ocean Depths",
    category: "Nature",
    downloads: "9.7K",
    likes: "2.3K",
    image: "/deep-ocean-underwater-mobile-wallpaper.png",
    resolution: "Full HD",
    orientation: "portrait",
    colors: ["blue", "green"],
  },
  {
    id: 5,
    title: "Neon City Nights",
    category: "Urban",
    downloads: "25.3K",
    likes: "4.2K",
    image: "/neon-city-nights-cyberpunk-mobile-wallpaper.png",
    resolution: "4K",
    orientation: "portrait",
    colors: ["purple", "pink"],
  },
  {
    id: 6,
    title: "Serene Lake",
    category: "Nature",
    downloads: "22.1K",
    likes: "3.8K",
    image: "/serene-lake-reflection-mobile-wallpaper.png",
    resolution: "2K",
    orientation: "portrait",
    colors: ["blue", "green"],
  },
]

export function SearchResults({ query, filters }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [resultsPerPage, setResultsPerPage] = useState("24")

  // Filter results based on search query and filters
  const filteredResults = mockResults.filter((wallpaper) => {
    const matchesQuery =
      !query ||
      wallpaper.title.toLowerCase().includes(query.toLowerCase()) ||
      wallpaper.category.toLowerCase().includes(query.toLowerCase())

    const matchesCategory = !filters.category || wallpaper.category === filters.category
    const matchesResolution = !filters.resolution || wallpaper.resolution.toLowerCase().includes(filters.resolution)
    const matchesOrientation = !filters.orientation || wallpaper.orientation === filters.orientation
    const matchesColor = !filters.color || wallpaper.colors.includes(filters.color)

    return matchesQuery && matchesCategory && matchesResolution && matchesOrientation && matchesColor
  })

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (filters.sortBy) {
      case "recent":
        return b.id - a.id // Assuming higher ID = more recent
      case "downloads":
        return Number.parseFloat(b.downloads.replace("K", "")) - Number.parseFloat(a.downloads.replace("K", ""))
      case "likes":
        return Number.parseFloat(b.likes.replace("K", "")) - Number.parseFloat(a.likes.replace("K", ""))
      case "trending":
        return Math.random() - 0.5 // Random for demo
      default: // popular
        return Number.parseFloat(b.downloads.replace("K", "")) - Number.parseFloat(a.downloads.replace("K", ""))
    }
  })

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {sortedResults.length} wallpapers found
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
      {sortedResults.length === 0 && (
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
      {sortedResults.length > 0 && (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {sortedResults.map((wallpaper) => (
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
                    src={wallpaper.image || "/placeholder.svg"}
                    alt={wallpaper.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <Badge variant="secondary" className="text-xs">
                        {wallpaper.resolution}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {wallpaper.orientation}
                      </Badge>
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
      {sortedResults.length > 0 && (
        <div className="text-center pt-8">
          <Button variant="outline" size="lg">
            Load More Wallpapers
          </Button>
        </div>
      )}
    </div>
  )
}
