"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, History, Trash2, Calendar } from "lucide-react"

interface DownloadHistoryItem {
  id: string
  title: string
  resolution: string
  format: string
  downloadedAt: string
  image: string
}

export function DownloadHistory() {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("wallpaper-downloads") || "[]")
    setHistory(savedHistory)
  }, [isOpen])

  const clearHistory = () => {
    localStorage.removeItem("wallpaper-downloads")
    setHistory([])
  }

  const removeItem = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index)
    setHistory(newHistory)
    localStorage.setItem("wallpaper-downloads", JSON.stringify(newHistory))
  }

  const redownload = (item: DownloadHistoryItem) => {
    const link = document.createElement("a")
    link.href = item.image
    link.download = `${item.title.replace(/\s+/g, "-").toLowerCase()}-${item.resolution}.${item.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <History className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Download History</span>
            </div>
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
              <p className="text-muted-foreground">Your download history will appear here</p>
            </div>
          ) : (
            history.map((item, index) => (
              <Card key={`${item.id}-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{item.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.resolution}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.format.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(item.downloadedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => redownload(item)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download Again
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
