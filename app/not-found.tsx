import Link from "next/link"
import { Metadata } from "next"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft, Image } from "lucide-react"

export const metadata: Metadata = {
  title: "404 - Page Not Found | WallpaperHub",
  description: "The page you're looking for doesn't exist. Explore our collection of premium mobile wallpapers and HD backgrounds.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "404 - Page Not Found | WallpaperHub",
    description: "The page you're looking for doesn't exist. Explore our collection of premium mobile wallpapers and HD backgrounds.",
    type: "website",
  },
  twitter: {
    title: "404 - Page Not Found | WallpaperHub",
    description: "The page you're looking for doesn't exist. Explore our collection of premium mobile wallpapers and HD backgrounds.",
  },
}

export default function NotFound() {
  // Structured data for 404 page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "404 - Page Not Found",
    "description": "The requested page could not be found on WallpaperHub.",
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/404`,
    "mainEntity": {
      "@type": "Thing",
      "name": "404 Error",
      "description": "Page not found error"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": process.env.NEXT_PUBLIC_SITE_URL || "https://wallpaperhub.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "404 - Page Not Found"
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center flex-1 text-center">
        <div className="max-w-md mx-auto">
          {/* 404 Illustration */}
          <div className="relative mb-8">
            <div className="text-8xl font-bold text-muted-foreground/20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image className="h-16 w-16 text-muted-foreground/60" />
            </div>
          </div>
          
          {/* Error Message */}
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Oops! Page not found
          </h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, you can explore our amazing collection of wallpapers instead!
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/categories">
                <Image className="h-4 w-4" />
                Browse Categories
              </Link>
            </Button>
            
            <Button asChild variant="ghost" size="lg" className="gap-2">
              <Link href="/search">
                <Search className="h-4 w-4" />
                Search Wallpapers
              </Link>
            </Button>
          </div>
          
          {/* Go Back Button - Using Link instead of client-side navigation */}
          <div className="mt-8 pt-8 border-t">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back to Home
            </Link>
          </div>
        </div>
        
        {/* Popular Categories */}
        <div className="mt-16 w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "Nature", slug: "nature", emoji: "🌿" },
              { name: "Abstract", slug: "abstract", emoji: "🎨" },
              { name: "Minimalist", slug: "minimalist", emoji: "⚪" },
              { name: "Space", slug: "space", emoji: "🚀" },
              { name: "Gaming", slug: "gaming", emoji: "🎮" },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {category.emoji}
                </div>
                <div className="text-sm font-medium group-hover:text-primary transition-colors">
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="mt-12 text-sm text-muted-foreground">
          <p>Quick Links:</p>
          <div className="flex flex-wrap gap-4 mt-2 justify-center">
            <Link href="/latest" className="hover:text-primary transition-colors">Latest Wallpapers</Link>
            <Link href="/popular" className="hover:text-primary transition-colors">Popular Wallpapers</Link>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}