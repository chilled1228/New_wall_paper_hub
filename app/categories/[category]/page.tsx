import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CategoryWallpapers } from "@/components/category-wallpapers"
import { CategoryHeader } from "@/components/category-header"

// Define available categories
const categories = [
  { slug: "nature", name: "Nature", description: "Breathtaking landscapes, wildlife, and natural wonders" },
  { slug: "abstract", name: "Abstract", description: "Creative and artistic designs with unique patterns" },
  { slug: "minimalist", name: "Minimalist", description: "Clean, simple designs with elegant aesthetics" },
  { slug: "space", name: "Space", description: "Cosmic scenes, galaxies, and astronomical wonders" },
  { slug: "gaming", name: "Gaming", description: "Video game inspired wallpapers and esports themes" },
  { slug: "cars", name: "Cars", description: "Luxury vehicles, sports cars, and automotive excellence" },
  { slug: "architecture", name: "Architecture", description: "Modern buildings, cityscapes, and structural beauty" },
  { slug: "flowers", name: "Flowers", description: "Beautiful blooms, botanical art, and floral designs" },
  { slug: "animals", name: "Animals", description: "Wildlife photography and adorable pet portraits" },
  { slug: "technology", name: "Technology", description: "Futuristic designs, gadgets, and digital art" },
]

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params
  const category = categories.find((cat) => cat.slug === categorySlug)

  if (!category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <CategoryHeader category={category} />
        <CategoryWallpapers categorySlug={categorySlug} />
      </main>
      <Footer />
    </div>
  )
}

// Generate static params for all categories (commented out for dynamic rendering)
// export function generateStaticParams() {
//   return categories.map((category) => ({
//     category: category.slug,
//   }))
// }

// Generate metadata for each category
export async function generateMetadata({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params
  const category = categories.find((cat) => cat.slug === categorySlug)

  if (!category) {
    return {
      title: "Category Not Found",
    }
  }

  return {
    title: `${category.name} Wallpapers - WallpaperHub`,
    description: `Download high-quality ${category.name.toLowerCase()} wallpapers. ${category.description}`,
  }
}

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0
