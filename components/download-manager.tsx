"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, CheckCircle, AlertCircle, X, FileImage, Smartphone, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DownloadManagerProps {
  wallpaper: {
    id: string
    title: string
    image: string
    resolutions: Array<{
      label: string
      width: number
      height: number
      size: string
    }>
  }
  isOpen: boolean
  onClose: () => void
}

interface DownloadProgress {
  id: string
  title: string
  resolution: string
  progress: number
  status: "downloading" | "completed" | "error"
  size: string
}

export function DownloadManager({ wallpaper, isOpen, onClose }: DownloadManagerProps) {
  const [selectedResolution, setSelectedResolution] = useState(wallpaper.resolutions[wallpaper.resolutions.length - 1])
  const [selectedFormat, setSelectedFormat] = useState("jpg")
  const [downloads, setDownloads] = useState<DownloadProgress[]>([])
  const { toast } = useToast()

  const formats = [
    { value: "jpg", label: "JPEG", description: "Best for photos, smaller file size" },
    { value: "png", label: "PNG", description: "Best quality, transparent backgrounds" },
    { value: "webp", label: "WebP", description: "Modern format, great compression" },
  ]

  const devicePresets = [
    { label: "iPhone 15 Pro", width: 1179, height: 2556 },
    { label: "Samsung Galaxy S24", width: 1080, height: 2340 },
    { label: "iPad Pro", width: 2048, height: 2732 },
    { label: "Desktop HD", width: 1920, height: 1080 },
    { label: "Desktop 4K", width: 3840, height: 2160 },
  ]

  const simulateDownload = async (resolution: typeof selectedResolution, format: string) => {
    const downloadId = `${wallpaper.id}-${Date.now()}`
    const newDownload: DownloadProgress = {
      id: downloadId,
      title: wallpaper.title,
      resolution: resolution.label,
      progress: 0,
      status: "downloading",
      size: resolution.size,
    }

    setDownloads((prev) => [newDownload, ...prev])

    // Simulate download progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setDownloads((prev) =>
        prev.map((download) => (download.id === downloadId ? { ...download, progress } : download)),
      )
    }

    // Complete download
    setDownloads((prev) =>
      prev.map((download) => (download.id === downloadId ? { ...download, status: "completed" } : download)),
    )

    // In a real app, this would trigger the actual file download
    const link = document.createElement("a")
    link.href = wallpaper.image
    link.download = `${wallpaper.title.replace(/\s+/g, "-").toLowerCase()}-${resolution.width}x${resolution.height}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Download Complete",
      description: `${wallpaper.title} (${resolution.label}) has been downloaded successfully.`,
    })

    // Track download in localStorage for history
    const downloadHistory = JSON.parse(localStorage.getItem("wallpaper-downloads") || "[]")
    downloadHistory.unshift({
      id: wallpaper.id,
      title: wallpaper.title,
      resolution: resolution.label,
      format,
      downloadedAt: new Date().toISOString(),
      image: wallpaper.image,
    })
    localStorage.setItem("wallpaper-downloads", JSON.stringify(downloadHistory.slice(0, 50))) // Keep last 50
  }

  const handleDownload = () => {
    simulateDownload(selectedResolution, selectedFormat)
  }

  const removeDownload = (id: string) => {
    setDownloads((prev) => prev.filter((download) => download.id !== id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Download {wallpaper.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <img
              src={wallpaper.image || "/placeholder.svg"}
              alt={wallpaper.title}
              className="w-16 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{wallpaper.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedResolution.width} × {selectedResolution.height} • {selectedResolution.size}
              </p>
            </div>
          </div>

          {/* Resolution Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Resolution</label>
            <Select
              value={selectedResolution.label}
              onValueChange={(value) => {
                const resolution = wallpaper.resolutions.find((r) => r.label === value)
                if (resolution) setSelectedResolution(resolution)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wallpaper.resolutions.map((resolution) => (
                  <SelectItem key={resolution.label} value={resolution.label}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>{resolution.label}</span>
                      </div>
                      <span className="text-muted-foreground ml-4">
                        {resolution.width}×{resolution.height} • {resolution.size}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Format</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <FileImage className="h-4 w-4" />
                        <span>{format.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quick Device Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {devicePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3 bg-transparent"
                  onClick={() => {
                    // Find closest resolution or create custom
                    const closest = wallpaper.resolutions.reduce((prev, curr) => {
                      const prevDiff = Math.abs(prev.width - preset.width) + Math.abs(prev.height - preset.height)
                      const currDiff = Math.abs(curr.width - preset.width) + Math.abs(curr.height - preset.height)
                      return currDiff < prevDiff ? curr : prev
                    })
                    setSelectedResolution(closest)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{preset.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {preset.width}×{preset.height}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Download {selectedFormat.toUpperCase()} ({selectedResolution.size})
          </Button>

          {/* Active Downloads */}
          {downloads.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Downloads</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {downloads.map((download) => (
                  <Card key={download.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {download.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {download.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {download.status === "downloading" && (
                              <Download className="h-4 w-4 text-primary animate-pulse" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{download.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {download.resolution}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDownload(download.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {download.status === "downloading" && (
                        <div className="space-y-1">
                          <Progress value={download.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{download.progress}%</span>
                            <span>{download.size}</span>
                          </div>
                        </div>
                      )}
                      {download.status === "completed" && (
                        <p className="text-xs text-green-600">Download completed successfully</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
