"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Heart, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WallpaperDetailsProps {
  wallpaper: {
    id: string
    title: string
    description: string
    category: string
    tags: string[]
    downloads: string
    likes: string
    views: string
    image_url: string
    resolutions: Array<{
      label: string
      width: number
      height: number
      size: string
    }>
    colors: string[]
    uploadDate: string
    author: string
    featured: boolean
  }
}

export function WallpaperDetails({ wallpaper }: WallpaperDetailsProps) {
  const [isLiked, setIsLiked] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    try {
      // Show loading state
      toast({
        title: "Preparing Download",
        description: "Please wait...",
      })

      // Fetch the image as blob to force download
      const response = await fetch(wallpaper.image_url)
      const blob = await response.blob()
      
      // Create object URL
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement("a")
      link.href = url
      link.download = `${wallpaper.title.replace(/\s+/g, "-").toLowerCase()}.jpg`
      
      // Force download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up object URL
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: `${wallpaper.title} is downloading...`,
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Download Failed", 
        description: "Please try again or right-click the image to save",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: wallpaper.title,
          text: wallpaper.description,
          url: window.location.href,
        })
      } catch (err) {
        navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied",
          description: "Wallpaper link copied to clipboard",
        })
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied", 
        description: "Wallpaper link copied to clipboard",
      })
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
    })
  }

  return (
    <section className="py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-md sm:max-w-2xl">
        {/* Back Button - Mobile First */}
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Mobile-First Layout */}
        <div className="space-y-6">
          {/* Main Image - Full width on mobile */}
          <div className="relative w-full">
            <div className="aspect-[9/16] sm:aspect-[3/4] w-full overflow-hidden rounded-lg">
              <img
                src={wallpaper.image_url || "/placeholder.svg"}
                alt={wallpaper.title}
                className="w-full h-full object-cover"
              />
            </div>
            {wallpaper.featured && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">
                Featured
              </Badge>
            )}
          </div>

          {/* Title and Category */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold">{wallpaper.title}</h1>
            <Badge variant="outline" className="text-sm">{wallpaper.category}</Badge>
            {wallpaper.description && (
              <p className="text-sm sm:text-base text-muted-foreground">{wallpaper.description}</p>
            )}
          </div>

          {/* Simple Stats */}
          <div className="flex justify-center space-x-6 py-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{wallpaper.downloads}</div>
              <div className="text-xs text-muted-foreground">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{wallpaper.likes}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>

          {/* Simple Action Buttons */}
          <div className="space-y-3">
            {/* Primary Download Button */}
            <Button 
              onClick={handleDownload} 
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Wallpaper
            </Button>

            {/* Secondary Actions */}
            <div className="flex space-x-3">
              <Button 
                variant={isLiked ? "default" : "outline"} 
                onClick={handleLike} 
                className="flex-1"
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button variant="outline" onClick={handleShare} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Tags - Only show if they exist */}
          {wallpaper.tags && wallpaper.tags.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-2">
                {wallpaper.tags.slice(0, 5).map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
