"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mountain, Palette, Minimize2, Flower, Gamepad2, Car, Building, Sparkles } from "lucide-react"
import Link from "next/link"

const categories = [
  {
    id: 1,
    name: "Nature",
    slug: "nature",
    count: "2.5K",
    icon: Mountain,
    image: "/nature-landscape-category-wallpaper.png",
    color: "text-green-600",
  },
  {
    id: 2,
    name: "Abstract",
    slug: "abstract",
    count: "1.8K",
    icon: Palette,
    image: "/abstract-colorful-category-wallpaper.png",
    color: "text-purple-600",
  },
  {
    id: 3,
    name: "Minimalist",
    slug: "minimalist",
    count: "1.2K",
    icon: Minimize2,
    image: "/minimalist-clean-category-wallpaper.png",
    color: "text-gray-600",
  },
  {
    id: 4,
    name: "Flowers",
    slug: "flowers",
    count: "950",
    icon: Flower,
    image: "/beautiful-flowers-category-wallpaper.png",
    color: "text-pink-600",
  },
  {
    id: 5,
    name: "Gaming",
    slug: "gaming",
    count: "780",
    icon: Gamepad2,
    image: "/gaming-esports-category-wallpaper.png",
    color: "text-blue-600",
  },
  {
    id: 6,
    name: "Cars",
    slug: "cars",
    count: "650",
    icon: Car,
    image: "/luxury-cars-category-wallpaper.png",
    color: "text-red-600",
  },
  {
    id: 7,
    name: "Architecture",
    slug: "architecture",
    count: "540",
    icon: Building,
    image: "/modern-architecture-category-wallpaper.png",
    color: "text-indigo-600",
  },
  {
    id: 8,
    name: "Space",
    slug: "space",
    count: "420",
    icon: Sparkles,
    image: "/space-galaxy-category-wallpaper.png",
    color: "text-violet-600",
  },
]

export function Categories() {
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Browse Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our diverse collection organized by themes and styles
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={category.image || "/placeholder.svg"}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                      {/* Content Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-3 group-hover:bg-white/30 transition-colors duration-300">
                          <IconComponent
                            className={`h-8 w-8 ${category.color} group-hover:text-white transition-colors duration-300`}
                          />
                        </div>
                        <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {category.count} wallpapers
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
