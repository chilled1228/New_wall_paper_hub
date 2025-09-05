"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Heart, Share2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WallpaperDetailsProps {
  wallpaper: {
    id: string
    title: string
    description: string | null
    category: string
    tags: string[] | null
    downloads?: string
    likes?: string
    views?: string
    image_url: string
    thumbnail_url?: string | null
    medium_url?: string | null
    large_url?: string | null
    original_url?: string | null
    resolutions?: Array<{
      label: string
      width: number
      height: number
      size: string
    }>
    colors?: string[]
    uploadDate?: string
    author?: string
    featured?: boolean
  }
}

export function WallpaperDetails({ wallpaper }: WallpaperDetailsProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [likeCount, setLikeCount] = useState(parseInt(wallpaper.likes || '0') || 0)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadCount, setDownloadCount] = useState(parseInt(wallpaper.downloads || '0') || 0)
  const { toast } = useToast()

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Optimized like status check - only check localStorage initially, API call on interaction
  useEffect(() => {
    if (!isHydrated) return

    const checkLikeStatusOptimized = async () => {
      try {
        // Start with localStorage only for initial state (faster)
        const likedWallpapers = JSON.parse(localStorage.getItem('liked_wallpapers') || '[]')
        setIsLiked(likedWallpapers.includes(wallpaper.id))
        
        // No immediate API calls - we'll only sync on user interaction
        // This reduces initial load time significantly
        
      } catch (error) {
        console.error('Error checking initial like status:', error)
        setIsLiked(false)
      }
    }

    // Only run if wallpaper.id exists
    if (wallpaper?.id) {
      checkLikeStatusOptimized()
    }
  }, [wallpaper?.id, isHydrated])

  // Prevent rendering interactive elements on server - MOVED AFTER HOOKS
  if (!isHydrated) {
    return (
      <section className="py-4 sm:py-8">
        <div className="container mx-auto px-4 max-w-md sm:max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="aspect-[9/16] sm:aspect-[3/4] w-full bg-gray-200 rounded-lg"></div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="h-12 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const handleDownload = async () => {
    if (isDownloading) return // Prevent multiple clicks
    if (!isHydrated) return // Don't run on server
    
    setIsDownloading(true)
    
    try {
      // Show loading state
      toast({
        title: "Preparing Original Quality Download",
        description: "Fetching full resolution wallpaper...",
      })

      // Use the new download API route which handles CORS and file serving
      const downloadUrl = `/api/download/${wallpaper.id}`
      
      // Create download link
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${wallpaper.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.jpg`
      
      // Force download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Record the download interaction and update count
      try {
        // Get device ID for tracking - ensure we're on client side
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          let deviceId = localStorage.getItem('simple_device_id')
          if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
            localStorage.setItem('simple_device_id', deviceId)
          }

          const response = await fetch('/api/interactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wallpaper_id: wallpaper.id,
              interaction_type: 'download',
              session_id: deviceId
            })
          })

          if (response.ok) {
            const data = await response.json()
            // Update download count if returned from API
            if (data.totalDownloads) {
              setDownloadCount(data.totalDownloads)
            } else {
              // Fallback: increment local count
              setDownloadCount(prev => prev + 1)
            }
          }
        } else {
          console.log('localStorage not available, skipping interaction tracking')
          // Still increment local count as fallback
          setDownloadCount(prev => prev + 1)
        }
      } catch (interactionError) {
        console.log('Failed to record download interaction:', interactionError)
        // Still increment local count as fallback
        setDownloadCount(prev => prev + 1)
      }

      toast({
        title: "Download Started! 📱",
        description: `${wallpaper.title} (original quality) is downloading...`,
      })

      // Small delay to show feedback before resetting button
      setTimeout(() => {
        setIsDownloading(false)
      }, 2000)

    } catch (error) {
      console.error('Download failed:', error)
      setIsDownloading(false)
      toast({
        title: "Download Failed", 
        description: "Please try again later. If the problem persists, try right-clicking the image to save.",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: wallpaper.title,
          text: wallpaper.description || '',
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

  const handleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    const newLikedState = !isLiked
    
    // Simple device ID using localStorage
    let deviceId = localStorage.getItem('simple_device_id')
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
      localStorage.setItem('simple_device_id', deviceId)
    }

    try {
      const response = await fetch(`/api/wallpapers/${wallpaper.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          action: newLikedState ? 'like' : 'unlike'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setIsLiked(data.liked)
        setLikeCount(data.totalLikes)

        // Update localStorage
        let likedWallpapers = JSON.parse(localStorage.getItem('liked_wallpapers') || '[]')
        if (data.liked && !likedWallpapers.includes(wallpaper.id)) {
          likedWallpapers.push(wallpaper.id)
        } else if (!data.liked) {
          likedWallpapers = likedWallpapers.filter((id: string) => id !== wallpaper.id)
        }
        localStorage.setItem('liked_wallpapers', JSON.stringify(likedWallpapers))

        toast({
          title: data.liked ? "Added to favorites! ❤️" : "Removed from favorites",
          description: data.liked ? `Total likes: ${data.totalLikes}` : "Like removed"
        })
      } else {
        throw new Error(data.error || 'Failed to update like')
      }
    } catch (error) {
      console.error('Error updating like:', error)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLiking(false)
    }
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
          {/* Main Image - Full width on mobile with optimization */}
          <div className="relative w-full">
            <div className="aspect-[9/16] sm:aspect-[3/4] w-full overflow-hidden rounded-lg">
              {/* Preload the medium quality image for faster loading */}
              <img
                src={wallpaper.medium_url || wallpaper.image_url || "/placeholder.svg"}
                alt={wallpaper.title}
                className="w-full h-full object-cover"
                loading="eager" // Load immediately since this is the main image
                decoding="async" // Non-blocking decode
                // Removed aggressive preloading for better performance
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
              <div className="text-lg font-bold text-primary">{downloadCount}</div>
              <div className="text-xs text-muted-foreground">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{likeCount}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>

          {/* Simple Action Buttons */}
          <div className="space-y-3">
            {/* Primary Download Button with Tooltip */}
            <div className="relative group">
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className={`w-full h-12 text-lg font-semibold relative transition-all duration-300 ${
                  isDownloading 
                    ? 'animate-pulse bg-primary/80 shadow-lg shadow-primary/50' 
                    : 'hover:shadow-md'
                }`}
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download Original Quality
                  </>
                )}
              </Button>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                <div className="text-center">
                  <div className="font-medium">Original Full Resolution</div>
                  <div className="text-xs text-gray-300">Highest quality • Perfect for all devices</div>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="flex space-x-3">
              <Button 
                variant={isLiked ? "default" : "outline"} 
                onClick={handleLike} 
                disabled={isLiking}
                className="flex-1"
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current text-red-500" : ""}`} />
                {isLiking ? "..." : (isLiked ? "Liked" : "Like")}
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
