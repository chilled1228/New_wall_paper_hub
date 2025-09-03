"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchFilters } from "@/components/search-filters"
import { SearchResults } from "@/components/search-results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    resolution: searchParams.get("resolution") || "",
    orientation: searchParams.get("orientation") || "",
    color: searchParams.get("color") || "",
    sortBy: searchParams.get("sort") || "popular",
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // In a real app, this would trigger a search API call
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    // In a real app, this would trigger a filtered search API call
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {searchQuery ? `Search results for "${searchQuery}"` : "Search Wallpapers"}
          </h1>

          {/* Enhanced Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for wallpapers, categories, colors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button onClick={() => handleSearch(searchQuery)} size="lg" className="px-8">
              Search
            </Button>
          </div>

          {/* Filter Toggle - Mobile */}
          <div className="lg:hidden mb-6">
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters & Sort
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SearchFilters filters={filters} onFiltersChange={handleFilterChange} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SearchFilters filters={filters} onFiltersChange={handleFilterChange} />
          </div>

          {/* Search Results */}
          <div className="flex-1">
            <SearchResults query={searchQuery} filters={filters} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
