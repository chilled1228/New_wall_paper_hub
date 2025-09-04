import { Footer } from "@/components/footer"
import { CategoriesGrid } from "@/components/categories-grid"
import { TrendingUp, Star, Clock } from "lucide-react"

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                <span>50+ Categories Available</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold mb-6">Browse by Category</h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Discover wallpapers organized by themes, styles, and subjects. From breathtaking nature scenes to
                cutting-edge abstract designs.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground mt-1">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground mt-1">Wallpapers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Daily</div>
                  <div className="text-sm text-muted-foreground mt-1">Updates</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">Featured Categories</h2>
                <p className="text-lg text-muted-foreground">Most popular categories this month</p>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Trending</span>
              </div>
            </div>

            <CategoriesGrid featured={true} />
          </div>
        </section>

        {/* All Categories */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">All Categories</h2>
                <p className="text-lg text-muted-foreground">Explore our complete collection</p>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Recently Updated</span>
              </div>
            </div>

            <CategoriesGrid featured={false} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
