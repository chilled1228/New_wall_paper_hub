import { HeroSection } from "@/components/hero-section"
import { PopularWallpapers } from "@/components/popular-wallpapers"
import { AllWallpapers } from "@/components/all-wallpapers"
import { Categories } from "@/components/categories"
import { Footer } from "@/components/footer"

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <PopularWallpapers />
        <AllWallpapers />
        <Categories />
      </main>
      <Footer />
    </div>
  )
}
