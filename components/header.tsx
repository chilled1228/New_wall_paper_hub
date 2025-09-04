"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu, Download, Heart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { DownloadHistory } from "@/components/download-history"

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Mobile Optimized */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg sm:text-xl">WallpaperHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/categories" className="text-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/popular" className="text-foreground hover:text-primary transition-colors">
              Popular
            </Link>
            <Link href="/latest" className="text-foreground hover:text-primary transition-colors">
              Latest
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wallpapers..."
                className="pl-10 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Right Actions - Mobile Optimized */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Search Toggle - Mobile */}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search className="h-5 w-5" />
            </Button>

            {/* Hide less important items on small mobile */}
            <div className="hidden sm:flex items-center space-x-2">
              <ThemeToggle />
              <DownloadHistory />
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[400px] max-w-[90vw] p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center space-x-3 p-6 pb-4 border-b bg-muted/20">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <Download className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">WallpaperHub</span>
                  </div>
                  
                  {/* Navigation Links */}
                  <nav className="flex flex-col p-4 flex-1" role="navigation" aria-label="Main navigation">
                    <div className="space-y-2">
                      <Link href="/" className="flex items-center py-4 px-4 rounded-xl text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none">
                        Home
                      </Link>
                      <Link href="/categories" className="flex items-center py-4 px-4 rounded-xl text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none">
                        Categories
                      </Link>
                      <Link href="/popular" className="flex items-center py-4 px-4 rounded-xl text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none">
                        Popular
                      </Link>
                      <Link href="/latest" className="flex items-center py-4 px-4 rounded-xl text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none">
                        Latest
                      </Link>
                    </div>
                  </nav>
                  
                  {/* Bottom Section */}
                  <div className="border-t bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-background border">
                      <span className="font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                    <div className="px-2">
                      <DownloadHistory />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="lg:hidden py-4 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wallpapers..."
                className="pl-10 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
