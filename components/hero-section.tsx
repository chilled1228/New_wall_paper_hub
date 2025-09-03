import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Premium Quality Wallpapers</span>
          </div>

          {/* Heading - Mobile Optimized */}
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Transform Your Screen with
            <span className="text-primary block mt-2">Stunning Wallpapers</span>
          </h1>

          {/* Description - Mobile Optimized */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Discover thousands of high-quality mobile wallpapers. From breathtaking nature scenes to minimalist designs,
            find the perfect backdrop for your device.
          </p>

          {/* CTA Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md sm:max-w-none mx-auto">
            <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
              Browse Wallpapers
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-transparent">
              View Categories
            </Button>
          </div>

          {/* Stats - Mobile Optimized */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">10K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Wallpapers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">50+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">1M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Downloads</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
