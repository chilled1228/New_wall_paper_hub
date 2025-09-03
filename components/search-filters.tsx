"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { RotateCcw } from "lucide-react"

interface SearchFiltersProps {
  filters: {
    category: string
    resolution: string
    orientation: string
    color: string
    sortBy: string
  }
  onFiltersChange: (filters: any) => void
}

const categories = [
  "Nature",
  "Abstract",
  "Minimalist",
  "Space",
  "Gaming",
  "Cars",
  "Architecture",
  "Flowers",
  "Animals",
  "Technology",
]

const resolutions = [
  { label: "HD (720p)", value: "hd" },
  { label: "Full HD (1080p)", value: "fhd" },
  { label: "2K (1440p)", value: "2k" },
  { label: "4K (2160p)", value: "4k" },
]

const orientations = [
  { label: "Portrait", value: "portrait" },
  { label: "Landscape", value: "landscape" },
  { label: "Square", value: "square" },
]

const colors = [
  { label: "Red", value: "red", color: "bg-red-500" },
  { label: "Blue", value: "blue", color: "bg-blue-500" },
  { label: "Green", value: "green", color: "bg-green-500" },
  { label: "Purple", value: "purple", color: "bg-purple-500" },
  { label: "Orange", value: "orange", color: "bg-orange-500" },
  { label: "Pink", value: "pink", color: "bg-pink-500" },
  { label: "Yellow", value: "yellow", color: "bg-yellow-500" },
  { label: "Black", value: "black", color: "bg-black" },
  { label: "White", value: "white", color: "bg-white border" },
]

const sortOptions = [
  { label: "Most Popular", value: "popular" },
  { label: "Most Recent", value: "recent" },
  { label: "Most Downloaded", value: "downloads" },
  { label: "Most Liked", value: "likes" },
  { label: "Trending", value: "trending" },
]

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      category: "",
      resolution: "",
      orientation: "",
      color: "",
      sortBy: "popular",
    })
  }

  const activeFiltersCount = Object.values(filters).filter((value) => value && value !== "popular").length

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter("category", "")}>
              {filters.category} ×
            </Badge>
          )}
          {filters.resolution && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter("resolution", "")}>
              {resolutions.find((r) => r.value === filters.resolution)?.label} ×
            </Badge>
          )}
          {filters.orientation && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter("orientation", "")}>
              {filters.orientation} ×
            </Badge>
          )}
          {filters.color && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter("color", "")}>
              {filters.color} ×
            </Badge>
          )}
        </div>
      )}

      {/* Sort By */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sort By</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
            {sortOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Separator />

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filters.category === category ? "default" : "ghost"}
                size="sm"
                className="justify-start h-8 text-xs"
                onClick={() => updateFilter("category", filters.category === category ? "" : category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resolution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup value={filters.resolution} onValueChange={(value) => updateFilter("resolution", value)}>
            {resolutions.map((resolution) => (
              <div key={resolution.value} className="flex items-center space-x-2">
                <RadioGroupItem value={resolution.value} id={resolution.value} />
                <Label htmlFor={resolution.value} className="text-sm font-normal cursor-pointer">
                  {resolution.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Orientation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Orientation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup value={filters.orientation} onValueChange={(value) => updateFilter("orientation", value)}>
            {orientations.map((orientation) => (
              <div key={orientation.value} className="flex items-center space-x-2">
                <RadioGroupItem value={orientation.value} id={orientation.value} />
                <Label htmlFor={orientation.value} className="text-sm font-normal cursor-pointer">
                  {orientation.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {colors.map((color) => (
              <Button
                key={color.value}
                variant={filters.color === color.value ? "default" : "ghost"}
                size="sm"
                className="h-10 flex-col gap-1 p-2"
                onClick={() => updateFilter("color", filters.color === color.value ? "" : color.value)}
              >
                <div className={`w-4 h-4 rounded-full ${color.color}`} />
                <span className="text-xs">{color.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
