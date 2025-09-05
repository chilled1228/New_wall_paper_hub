"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Heart, Eye, Star } from "lucide-react"
import { WallpaperWithStats } from "@/lib/database.types"
import { generateWallpaperSlug } from "@/lib/slug-utils"
import { generateAltText } from "@/lib/seo-utils"
import { OptimizedImage } from "@/components/optimized-image"

interface WallpaperCardProps {
  wallpaper: WallpaperWithStats
  variant?: "default" | "compact" | "featured"
  showRank?: boolean
  rank?: number
  priority?: boolean
}

export function WallpaperCard({ 
  wallpaper, 
  variant = "default", 
  showRank = false, 
  rank, 
  priority = false 
}: WallpaperCardProps) {
  const cardClassName = {
    default: "group cursor-pointer transform hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl",
    compact: "group cursor-pointer hover:shadow-lg transition-all duration-300",
    featured: "group cursor-pointer transform hover:-translate-y-3 transition-all duration-500 hover:shadow-2xl ring-2 ring-primary/20"
  }

  const aspectRatio = {
    default: "aspect-[3/4]",
    compact: "aspect-[9/16] sm:aspect-[3/4]", 
    featured: "aspect-[4/5]"
  }

  return (
    <Link href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}>
      <Card className={cardClassName[variant]}>
        <CardContent className="p-0">
          {/* Image Container */}
          <div className={`relative ${aspectRatio[variant]} overflow-hidden`}>
            <OptimizedImage
              src={wallpaper.image_url}
              thumbnailSrc={wallpaper.thumbnail_url || undefined}
              mediumSrc={wallpaper.medium_url || undefined}
              largeSrc={wallpaper.large_url || undefined}
              originalSrc={wallpaper.original_url || undefined}
              alt={generateAltText(wallpaper, 'thumbnail')}
              width={400}
              height={600}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              priority={priority}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* Rank Badge */}
              {showRank && rank && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg border-0 font-poppins">
                  #{rank}
                </Badge>
              )}
              
              {/* Category Badge */}
              <Badge 
                className="bg-white/20 backdrop-blur-md text-white border-white/30 shadow-lg ml-auto font-poppins"
                variant="secondary"
              >
                {wallpaper.category}
              </Badge>
            </div>

            {/* Featured Badge */}
            {variant === "featured" && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg font-poppins">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Hover Action Buttons */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
              <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="bg-white/90 hover:bg-white text-black shadow-lg backdrop-blur-sm border-0 px-3 py-2 text-sm font-medium cursor-pointer font-poppins">
                  <Eye className="h-4 w-4 mr-1 inline" />
                  View
                </div>
                <div className="bg-primary/90 hover:bg-primary shadow-lg backdrop-blur-sm border-0 px-3 py-2 text-sm font-medium text-white cursor-pointer font-poppins">
                  <Download className="h-4 w-4 mr-1 inline" />
                  Download
                </div>
              </div>
            </div>

            {/* Quick Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <div className="bg-white/95 backdrop-blur-md p-3 shadow-lg">
                <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1 font-poppins">
                  {wallpaper.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-3 font-roboto">
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
            </div>
          </div>

          {/* Card Content (for compact variant) */}
          {variant === "compact" && (
            <div className="p-4">
              <h3 className="font-semibold text-base mb-2 line-clamp-1 font-poppins">{wallpaper.title}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-3 font-roboto">
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
          )}
        </CardContent>
      </Card>
    </Link>
  )
}