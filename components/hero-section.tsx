import { ArrowRight, Sparkles, Download, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Enhanced Background with animated gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-primary/5 to-transparent animate-pulse" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-5xl mx-auto">
          {/* Enhanced Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30 text-primary px-6 py-3 text-sm font-medium mb-8 shadow-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold font-poppins">Premium Quality Wallpapers</span>
          </div>

          {/* Enhanced Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1] font-poppins">
            Transform Your Screen with{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent block mt-2">
              Stunning Wallpapers
            </span>
          </h1>

          {/* Enhanced Description */}
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-roboto">
            Discover thousands of{" "}
            <span className="text-foreground font-semibold">high-quality mobile wallpapers</span>.
            From breathtaking nature scenes to minimalist designs,
            find the perfect backdrop for your device.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="#wallpapers">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-poppins"
              >
                <Download className="mr-2 h-5 w-5" />
                Browse Wallpapers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-4 border-2 border-primary/30 hover:border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl font-poppins"
              >
                <Star className="mr-2 h-5 w-5" />
                View Categories
              </Button>
            </Link>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-gradient-to-r from-transparent via-border to-transparent">
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                10K+
              </div>
              <div className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">
                Premium Wallpapers
              </div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                50+
              </div>
              <div className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">
                Categories
              </div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                1M+
              </div>
              <div className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">
                Happy Downloads
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}