// Image optimization utilities

export interface ImageResolutions {
  thumbnail: string    // 150x200 - for grid previews
  medium: string      // 400x533 - for list view and mobile
  large: string       // 800x1067 - for desktop preview
  original: string    // Original high quality - for download
}

// Generate optimized image URLs (placeholder function)
// In production, you would integrate with image CDN like Cloudinary, Uploadcare, etc.
export function generateImageResolutions(originalUrl: string): ImageResolutions {
  // This is a placeholder implementation
  // In production, you would replace this with actual image transformation logic
  
  const baseUrl = originalUrl.replace(/\.[^/.]+$/, '') // Remove extension
  const extension = originalUrl.match(/\.[^/.]+$/)?.[0] || '.jpg'
  
  return {
    thumbnail: `${baseUrl}_thumb${extension}`,
    medium: `${baseUrl}_medium${extension}`,
    large: `${baseUrl}_large${extension}`,
    original: originalUrl
  }
}

// Convert file size to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Estimate file sizes based on resolution
export function estimateImageSizes(width: number, height: number) {
  const pixelCount = width * height
  
  // Rough estimates based on JPEG compression
  return {
    thumbnail: formatFileSize(pixelCount * 0.1), // Highly compressed thumbnail
    medium: formatFileSize(pixelCount * 0.3),    // Medium quality
    large: formatFileSize(pixelCount * 0.5),     // Good quality
    original: formatFileSize(pixelCount * 0.8)   // High quality
  }
}

// Get the appropriate image URL based on container size and device capabilities
export function getOptimizedImageUrl(
  imageUrls: Partial<ImageResolutions>,
  containerWidth?: number,
  containerHeight?: number,
  devicePixelRatio: number = 1
): string {
  const effectiveWidth = (containerWidth || 400) * devicePixelRatio
  
  // Choose the most appropriate image size
  if (effectiveWidth <= 200 && imageUrls.thumbnail) {
    return imageUrls.thumbnail
  } else if (effectiveWidth <= 500 && imageUrls.medium) {
    return imageUrls.medium
  } else if (effectiveWidth <= 900 && imageUrls.large) {
    return imageUrls.large
  } else if (imageUrls.original) {
    return imageUrls.original
  }
  
  // Fallback to the largest available image
  return imageUrls.original || imageUrls.large || imageUrls.medium || imageUrls.thumbnail || ''
}

// Progressive loading strategy
export class ProgressiveImageLoader {
  private loadedImages = new Set<string>()
  
  async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.loadedImages.has(url)) {
        // Create a new image element even if cached for consistency
        const img = new Image()
        img.src = url
        resolve(img)
        return
      }
      
      const img = new Image()
      
      img.onload = () => {
        this.loadedImages.add(url)
        resolve(img)
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`))
      }
      
      img.src = url
    })
  }
  
  async loadImageSequence(urls: string[]): Promise<HTMLImageElement[]> {
    const images: HTMLImageElement[] = []
    
    for (const url of urls) {
      try {
        const img = await this.loadImage(url)
        images.push(img)
      } catch (error) {
        console.warn(`Failed to load image: ${url}`, error)
      }
    }
    
    return images
  }
}

// Preload critical images
export function preloadCriticalImages(imageUrls: string[]) {
  if (typeof window === 'undefined') return
  
  imageUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

// Lazy load images with intersection observer
export function createImageLazyLoader() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src
        
        if (src) {
          img.src = src
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  })
  
  return imageObserver
}