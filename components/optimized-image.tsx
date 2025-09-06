'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface WallpaperImageProps {
  wallpaper: {
    image_url: string
    thumbnail_url?: string
    medium_url?: string
    large_url?: string
    original_url?: string
  }
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  onLoad?: () => void
  quality?: number
}

interface OptimizedImageProps {
  src: string
  thumbnailSrc?: string
  mediumSrc?: string
  largeSrc?: string
  originalSrc?: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  onLoad?: () => void
  quality?: number
}

// Overloaded function for wallpaper prop
export function OptimizedImage(props: WallpaperImageProps): React.ReactElement
export function OptimizedImage(props: OptimizedImageProps): React.ReactElement
export function OptimizedImage(props: WallpaperImageProps | OptimizedImageProps): React.ReactElement {
  // Type guard to check if it's wallpaper props
  if ('wallpaper' in props) {
    const {
      wallpaper,
      alt,
      className = '',
      fill = false,
      width,
      height,
      priority = false,
      sizes,
      onLoad,
      quality = 75
    } = props
    
    return OptimizedImageInternal({
      src: wallpaper.image_url,
      thumbnailSrc: wallpaper.thumbnail_url,
      mediumSrc: wallpaper.medium_url,
      largeSrc: wallpaper.large_url,
      originalSrc: wallpaper.original_url,
      alt,
      className,
      fill,
      width,
      height,
      priority,
      sizes,
      onLoad,
      quality
    })
  } else {
    const {
      src,
      thumbnailSrc,
      mediumSrc,
      largeSrc,
      originalSrc,
      alt,
      className = '',
      fill = false,
      width,
      height,
      priority = false,
      sizes,
      onLoad,
      quality = 75
    } = props
    
    return OptimizedImageInternal({
      src,
      thumbnailSrc,
      mediumSrc,
      largeSrc,
      originalSrc,
      alt,
      className,
      fill,
      width,
      height,
      priority,
      sizes,
      onLoad,
      quality
    })
  }
}

function OptimizedImageInternal({
  src,
  thumbnailSrc,
  mediumSrc,
  largeSrc,
  originalSrc,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  sizes,
  onLoad,
  quality = 75
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src)
  const [isLoading, setIsLoading] = useState(true)
  const [highQualityLoaded, setHighQualityLoaded] = useState(false)

  // Determine the appropriate high-quality source based on screen size
  const getHighQualitySrc = () => {
    if (typeof window === 'undefined') return mediumSrc || largeSrc || originalSrc || src

    const screenWidth = window.innerWidth
    
    // Progressive quality based on screen size
    if (screenWidth <= 1200 && mediumSrc) {
      return mediumSrc // Good quality for most devices
    } else if (screenWidth <= 1800 && largeSrc) {
      return largeSrc // High quality for large screens
    } else if (originalSrc) {
      return originalSrc // Full quality for very large screens
    } else {
      return largeSrc || mediumSrc || src // Fallback chain
    }
  }

  useEffect(() => {
    // Load high-quality image after component mounts
    if (!highQualityLoaded) {
      const highQualitySrc = getHighQualitySrc()
      
      if (highQualitySrc && highQualitySrc !== currentSrc) {
        const img = new window.Image()
        
        img.onload = () => {
          setCurrentSrc(highQualitySrc)
          setHighQualityLoaded(true)
          setIsLoading(false)
          onLoad?.()
        }
        
        img.onerror = () => {
          // Fallback to original src if high-quality image fails
          setCurrentSrc(src)
          setHighQualityLoaded(true)
          setIsLoading(false)
          onLoad?.()
        }
        
        img.src = highQualitySrc
      } else {
        setIsLoading(false)
        onLoad?.()
      }
    }
  }, [highQualityLoaded, currentSrc, src, mediumSrc, largeSrc, originalSrc, onLoad])

  const handleImageLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

  return (
    <div className={`relative ${className}`}>
      {/* Low-quality placeholder/thumbnail */}
      {thumbnailSrc && !highQualityLoaded && (
        <div className="absolute inset-0">
          <Image
            src={thumbnailSrc}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            className="object-cover blur-sm scale-110 transition-opacity duration-300"
            quality={30}
            priority={priority}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}

      {/* High-quality image */}
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`object-cover transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        quality={quality}
        sizes={responsiveSizes}
        priority={priority}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}