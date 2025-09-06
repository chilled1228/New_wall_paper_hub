import { SimpleGallery } from "@/components/simple-gallery"
import { Footer } from "@/components/footer"

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
