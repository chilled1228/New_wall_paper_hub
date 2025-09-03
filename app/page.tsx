import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AllWallpapers } from "@/components/all-wallpapers"
import { Categories } from "@/components/categories"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AllWallpapers />
        <Categories />
      </main>
      <Footer />
    </div>
  )
}
