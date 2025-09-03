import Link from "next/link"
import { Download, Heart, Github, Twitter, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">WallpaperHub</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your ultimate destination for premium mobile wallpapers. Discover, download, and transform your device
              with stunning visuals.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categories/nature" className="text-muted-foreground hover:text-primary transition-colors">
                  Nature
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/abstract"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Abstract
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/minimalist"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Minimalist
                </Link>
              </li>
              <li>
                <Link href="/categories/space" className="text-muted-foreground hover:text-primary transition-colors">
                  Space
                </Link>
              </li>
              <li>
                <Link href="/categories/gaming" className="text-muted-foreground hover:text-primary transition-colors">
                  Gaming
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-primary hover:text-primary/80 transition-colors">
                  View All
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/popular" className="text-muted-foreground hover:text-primary transition-colors">
                  Popular
                </Link>
              </li>
              <li>
                <Link href="/latest" className="text-muted-foreground hover:text-primary transition-colors">
                  Latest
                </Link>
              </li>
              <li>
                <Link href="/featured" className="text-muted-foreground hover:text-primary transition-colors">
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-muted-foreground hover:text-primary transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-muted-foreground hover:text-primary transition-colors">
                  Submit Wallpaper
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-muted-foreground hover:text-primary transition-colors">
                  DMCA
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">© 2024 WallpaperHub. All rights reserved.</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>for mobile enthusiasts</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
