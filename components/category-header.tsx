import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, Heart, Download } from "lucide-react"
import Link from "next/link"

interface CategoryHeaderProps {
  category: {
    slug: string
    name: string
    description: string
  }
}

export function CategoryHeader({ category }: CategoryHeaderProps) {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-primary transition-colors">
            Categories
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{category.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex-1">
            {/* Back Button */}
            <Link href="/categories">
              <Button variant="ghost" className="mb-6 -ml-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </Link>

            {/* Category Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl lg:text-5xl font-bold">{category.name}</h1>
                <Badge variant="secondary" className="text-sm">
                  Premium Collection
                </Badge>
              </div>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">{category.description}</p>

              {/* Stats */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>2.5K wallpapers</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span>125K likes</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Updated daily</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="lg">
              <Heart className="h-4 w-4 mr-2" />
              Follow Category
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
