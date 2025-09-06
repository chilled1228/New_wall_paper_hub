import { SimpleGallery } from "@/components/simple-gallery"
import { Footer } from "@/components/footer"

// Enable static generation with reasonable revalidation
export const revalidate = 60 // Revalidate every minute

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <SimpleGallery />
      </main>
      <Footer />
    </div>
  )
}
