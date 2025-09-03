"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ArrowLeft, Download, Heart, Share2, Eye, Calendar, User, Palette, Star } from "lucide-react"
import { DownloadManager } from "@/components/download-manager"
import { useToast } from "@/hooks/use-toast"
import { generateAltText } from "@/lib/seo-utils"

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const { toast } = useToast()

  const handleQuickDownload = () => {
    // Quick download with highest resolution
    const highestRes = wallpaper.resolutions[wallpaper.resolutions.length - 1]
    const link = document.createElement("a")
    link.href = wallpaper.image_url
    link.download = `${wallpaper.title.replace(/\s+/g, "-").toLowerCase()}-${highestRes.width}x${highestRes.height}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Track download
    const downloadHistory = JSON.parse(localStorage.getItem("wallpaper-downloads") || "[]")
    downloadHistory.unshift({
      id: wallpaper.id,
      title: wallpaper.title,
      resolution: highestRes.label,
      format: "jpg",
      downloadedAt: new Date().toISOString(),
      image: wallpaper.image_url,
    })
    localStorage.setItem("wallpaper-downloads", JSON.stringify(downloadHistory.slice(0, 50)))

    toast({
      title: "Download Started",
      description: `${wallpaper.title} (${highestRes.label}) is downloading...`,
    })
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
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "Wallpaper link has been copied to clipboard",
      })
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Wallpaper removed from your favorites" : "Wallpaper added to your favorites",
    })
  }

  return (
    <section className="py-8 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/categories/${wallpaper.category.toLowerCase()}`}
            className="hover:text-primary transition-colors"
          >
            {wallpaper.category}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{wallpaper.title}</span>
        </div>

        {/* Back Button */}
        <Button variant="ghost" className="mb-8 -ml-4" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-6">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] group cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
                  <img
                    src={wallpaper.image_url || "/placeholder.svg"}
                    alt={generateAltText(wallpaper, 'full-size')}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="lg" variant="secondary">
                        <Eye className="h-5 w-5 mr-2" />
                        Preview Full Size
                      </Button>
                    </div>
                  </div>
                  {wallpaper.featured && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Color Palette</h3>
                </div>
                <div className="flex space-x-3">
                  {wallpaper.colors.map((color, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-border mb-2 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <span className="text-xs text-muted-foreground font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold">{wallpaper.title}</h1>
                <Badge variant="outline">{wallpaper.category}</Badge>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">{wallpaper.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 py-6 border-y border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{wallpaper.downloads}</div>
                <div className="text-sm text-muted-foreground">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{wallpaper.likes}</div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{wallpaper.views}</div>
                <div className="text-sm text-muted-foreground">Views</div>
              </div>
            </div>

            {/* Download Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Download Options</h3>

                  <div className="flex space-x-3">
                    <Button onClick={() => setIsDownloadOpen(true)} className="flex-1" size="lg">
                      <Download className="h-5 w-5 mr-2" />
                      Download (Choose Options)
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleQuickDownload}>
                      Quick Download
                    </Button>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant={isLiked ? "default" : "outline"} size="lg" onClick={handleLike} className="flex-1">
                      <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
                      {isLiked ? "Liked" : "Like"}
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleShare}>
                      <Share2 className="h-5 w-5 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Available in {wallpaper.resolutions.length} resolutions • Multiple formats supported
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Author</span>
                    </div>
                    <span className="font-medium">{wallpaper.author}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Upload Date</span>
                    </div>
                    <span className="font-medium">
                      {new Date(wallpaper.uploadDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {wallpaper.tags.map((tag) => (
                    <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                      <Badge
                        variant="secondary"
                        className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Size Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl w-full p-0">
            <div className="relative">
              <img
                src={wallpaper.image_url || "/placeholder.svg"}
                alt={generateAltText(wallpaper, 'preview')}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <Button
                variant="secondary"
                size="lg"
                className="absolute bottom-4 right-4"
                onClick={() => setIsDownloadOpen(true)}
              >
                <Download className="h-5 w-5 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DownloadManager wallpaper={wallpaper} isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
      </div>
    </section>
  )
}
