"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { generateWallpaperSlug } from "@/lib/slug-utils"

export default function SimpleSearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!query) return

    setLoading(true)
    setError("")

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setResults(data.wallpapers || [])
        }
      })
      .catch(err => {
        setError("Failed to search")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [query])

  if (loading) return <div className="p-8">Searching...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        Search Results for "{query}"
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.map((wallpaper: any) => (
          <Link 
            key={wallpaper.id} 
            href={`/wallpaper/${generateWallpaperSlug(wallpaper)}`}
            className="block"
          >
            <div className="aspect-[3/4] relative bg-gray-200 rounded overflow-hidden">
              <Image
                src={wallpaper.medium_url || wallpaper.image_url || "/placeholder.svg"}
                alt={wallpaper.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <h3 className="mt-2 text-sm font-medium truncate">{wallpaper.title}</h3>
          </Link>
        ))}
      </div>

      {results.length === 0 && query && !loading && (
        <p className="text-gray-500 text-center py-8">No results found</p>
      )}
    </div>
  )
}