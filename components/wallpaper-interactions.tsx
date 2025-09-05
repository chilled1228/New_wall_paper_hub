'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Heart, Download, Eye } from "lucide-react"
import { trackInteraction, hasUserLiked, markWallpaperAsLiked, formatNumber } from '@/lib/interactions'
import { WallpaperStats } from '@/lib/database.types'
import { toast } from 'sonner'

interface WallpaperInteractionsProps {
  wallpaperId: string
  initialStats?: WallpaperStats | null
  imageUrl?: string
  title?: string
}

export function WallpaperInteractions({ 
  wallpaperId, 
  initialStats, 
  imageUrl, 
  title 
}: WallpaperInteractionsProps) {
  const [stats, setStats] = useState(initialStats)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLiked(hasUserLiked(wallpaperId))
    
    // Track view automatically when component mounts
    trackInteraction(wallpaperId, 'view').then((result) => {
      if (result.success && result.stats) {
        setStats(result.stats)
      }
    })
  }, [wallpaperId])

  const handleLike = async () => {
    if (isLiked) {
      toast.info('You have already liked this wallpaper')
      return
    }

    setIsLoading(true)
    const result = await trackInteraction(wallpaperId, 'like')
    setIsLoading(false)

    if (result.success) {
      setIsLiked(true)
      markWallpaperAsLiked(wallpaperId)
      if (result.stats) {
        setStats(result.stats)
      }
      toast.success('Wallpaper liked!')
    } else {
      toast.error(result.error || 'Failed to like wallpaper')
    }
  }

  const handleDownload = async () => {
    setIsLoading(true)
    const result = await trackInteraction(wallpaperId, 'download')
    setIsLoading(false)

    if (result.success) {
      if (result.stats) {
        setStats(result.stats)
      }
      
      // Use the download API route which handles CORS and file serving
      const apiDownloadUrl = `/api/download/${wallpaperId}`
      
      const link = document.createElement('a')
      link.href = apiDownloadUrl
      link.download = `${title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'wallpaper'}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('High-quality wallpaper download started!')
    } else {
      toast.error(result.error || 'Failed to track download')
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span>{formatNumber(stats?.views || 0)} views</span>
      </div>
      
      <Button
        variant={isLiked ? "default" : "outline"}
        size="sm"
        onClick={handleLike}
        disabled={isLoading}
        className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
      >
        <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-white' : ''}`} />
        {formatNumber(stats?.likes || 0)} likes
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isLoading}
      >
        <Download className="w-4 h-4 mr-2" />
        {formatNumber(stats?.downloads || 0)} downloads
      </Button>
    </div>
  )
}