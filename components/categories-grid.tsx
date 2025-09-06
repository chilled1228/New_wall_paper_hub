import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mountain,
  Palette,
  Minimize2,
  Flower,
  Gamepad2,
  Car,
  Building,
  Sparkles,
  Camera,
  Smartphone,
  Heart,
  Zap,
} from "lucide-react"

interface CategoriesGridProps {
  featured?: boolean
}

const allCategories = [
  {
    id: 1,
    name: "Nature",
    slug: "nature",
    count: "2.5K",
    icon: Mountain,
    image: "/nature-landscape-category-wallpaper.png",
    color: "text-green-600",
    featured: true,
  },
  {
    id: 2,
    name: "Abstract",
    slug: "abstract",
    count: "1.8K",
    icon: Palette,
    image: "/abstract-colorful-category-wallpaper.png",
    color: "text-purple-600",
    featured: true,
  },
  {
    id: 3,
    name: "Minimalist",
    slug: "minimalist",
    count: "1.2K",
    icon: Minimize2,
    image: "/minimalist-clean-category-wallpaper.png",
    color: "text-gray-600",
    featured: true,
  },
  {
    id: 4,
    name: "Flowers",
    slug: "flowers",
    count: "950",
    icon: Flower,
    image: "/beautiful-flowers-category-wallpaper.png",
    color: "text-pink-600",
    featured: true,
  },
  {
    id: 5,
    name: "Gaming",
    slug: "gaming",
    count: "780",
    icon: Gamepad2,
    image: "/gaming-esports-category-wallpaper.png",
    color: "text-blue-600",
    featured: true,
  },
  {
    id: 6,
    name: "Cars",
    slug: "cars",
    count: "650",
    icon: Car,
    image: "/luxury-cars-category-wallpaper.png",
    color: "text-red-600",
    featured: true,
  },
  {
    id: 7,
    name: "Architecture",
    slug: "architecture",
    count: "540",
    icon: Building,
    image: "/modern-architecture-category-wallpaper.png",
    color: "text-indigo-600",
    featured: true,
  },
  {
    id: 8,
    name: "Space",
    slug: "space",
    count: "420",
    icon: Sparkles,
    image: "/space-galaxy-category-wallpaper.png",
    color: "text-violet-600",
    featured: true,
  },
  // Additional categories (not featured)
  {
    id: 9,
    name: "Animals",
    slug: "animals",
    count: "890",
    icon: Heart,
    image: "/cute-animals-wildlife.png",
    color: "text-orange-600",
    featured: false,
  },
  {
    id: 10,
    name: "Technology",
    slug: "technology",
    count: "720",
    icon: Smartphone,
    image: "/futuristic-technology-gadgets.png",
    color: "text-cyan-600",
    featured: false,
  },
  {
    id: 11,
    name: "Photography",
    slug: "photography",
    count: "680",
    icon: Camera,
    image: "/artistic-photography-black-white.png",
    color: "text-slate-600",
    featured: false,
  },
  {
    id: 12,
    name: "Energy",
    slug: "energy",
    count: "340",
    icon: Zap,
    image: "/lightning-energy-electric.png",
    color: "text-yellow-600",
    featured: false,
  },
]

export function CategoriesGrid({ featured = false }: CategoriesGridProps) {
  const categories = featured ? allCategories.filter((cat) => cat.featured) : allCategories

  return (
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
                    alt={`${category.name} category wallpapers - Browse ${category.count} ${category.name.toLowerCase()} wallpapers for mobile`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                  {/* Featured Badge */}
                  {category.featured && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">Featured</Badge>
                  )}

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
  )
}
