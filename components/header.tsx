"use client"

import React, { useState, useCallback } from "react"
import type { KeyboardEvent } from "react"
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

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }, [router])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery)
    }
  }, [handleSearch, searchQuery])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const handleSearchAndClose = useCallback(() => {
    handleSearch(searchQuery)
    setIsSearchOpen(false)
  }, [handleSearch, searchQuery])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar - Distinct sections for better control */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Section: Logo */}
          <div className="flex items-center justify-start flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary flex items-center justify-center">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg xl:text-xl whitespace-nowrap hidden sm:block font-poppins">
                WallpaperHub
              </span>
              <span className="font-bold text-base whitespace-nowrap sm:hidden font-poppins">
                WHub
              </span>
            </Link>
          </div>

          {/* Center Section: Navigation Menu - Better breakpoints */}
          <div className="flex items-center justify-center flex-1 px-4">
            {/* Desktop Navigation - Adjusted for small PC screens with prefetch */}
            <nav className="hidden xl:flex items-center space-x-6">
              <Link 
                href="/" 
                prefetch={true}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap px-3 py-2 hover:bg-accent/50 font-poppins"
              >
                Home
              </Link>
              <Link 
                href="/categories" 
                prefetch={true}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap px-3 py-2 hover:bg-accent/50 font-poppins"
              >
                Categories
              </Link>
              <Link 
                href="/popular" 
                prefetch={true}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap px-3 py-2 hover:bg-accent/50 font-poppins"
              >
                Popular
              </Link>
              <Link 
                href="/latest" 
                prefetch={true}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap px-3 py-2 hover:bg-accent/50 font-poppins"
              >
                Latest
              </Link>
            </nav>

            {/* Desktop Search - Show on larger screens with more space */}
            <div className="hidden 2xl:flex items-center w-full max-w-md ml-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wallpapers..."
                  className="pl-10 bg-muted/50 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center justify-end space-x-2 flex-shrink-0">
            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              {/* Search Toggle - Mobile/Tablet/Small PC */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="2xl:hidden flex-shrink-0" 
                onClick={toggleSearch}
                aria-label="Toggle search"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Theme and Download - Show on medium+ screens */}
              <div className="hidden md:flex items-center space-x-1">
                <ThemeToggle />
                <DownloadHistory />
              </div>

              {/* Mobile Menu - Show on smaller screens */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="xl:hidden flex-shrink-0" 
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] sm:w-[400px] max-w-[90vw] p-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center space-x-3 p-6 pb-4 border-b bg-muted/20">
                      <div className="h-8 w-8 bg-primary flex items-center justify-center">
                        <Download className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <span className="font-bold text-lg font-poppins">WallpaperHub</span>
                    </div>
                    
                    {/* Navigation Links */}
                    <nav className="flex flex-col p-4 flex-1" role="navigation" aria-label="Main navigation">
                      <div className="space-y-2">
                        <Link 
                          href="/" 
                          prefetch={true}
                          className="flex items-center py-4 px-4 text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none font-poppins"
                        >
                          Home
                        </Link>
                        <Link 
                          href="/categories" 
                          prefetch={true}
                          className="flex items-center py-4 px-4 text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none font-poppins"
                        >
                          Categories
                        </Link>
                        <Link 
                          href="/popular" 
                          prefetch={true}
                          className="flex items-center py-4 px-4 text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none font-poppins"
                        >
                          Popular
                        </Link>
                        <Link 
                          href="/latest" 
                          prefetch={true}
                          className="flex items-center py-4 px-4 text-lg font-medium hover:bg-accent/50 active:bg-accent transition-colors border border-transparent hover:border-border focus:ring-2 focus:ring-primary focus:outline-none font-poppins"
                        >
                          Latest
                        </Link>
                      </div>
                    </nav>
                    
                    {/* Bottom Section - Enhanced for mobile */}
                    <div className="border-t bg-muted/20 p-4 space-y-4">
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between py-3 px-4 bg-background border">
                        <span className="font-medium font-poppins">Theme</span>
                        <ThemeToggle />
                      </div>
                      
                      {/* Download History - Full width on mobile */}
                      <div className="w-full">
                        <DownloadHistory />
                      </div>
                      
                      {/* Additional Options for small screens */}
                      <div className="sm:hidden pt-2 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                          WallpaperHub - High Quality Wallpapers
                        </p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Better positioned */}
        {isSearchOpen && (
          <div className="2xl:hidden border-t bg-muted/10">
            <div className="py-4 px-4 sm:px-6">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search wallpapers..."
                    className="pl-10 bg-background border-2 w-full h-12 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="default" 
                    className="flex-1 h-10" 
                    onClick={handleSearchAndClose}
                  >
                    Search
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-4 h-10" 
                    onClick={closeSearch}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}