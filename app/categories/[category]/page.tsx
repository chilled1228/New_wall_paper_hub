import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Footer } from "@/components/footer"
import { CategoryWallpapers } from "@/components/category-wallpapers"
import { CategoryHeader } from "@/components/category-header"
import { supabase } from "@/lib/supabase"
import {
  generateCategoryMetadata,
  generateCategoryStructuredData,
  generateBreadcrumbStructuredData
} from "@/lib/seo-utils"

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

  // Get wallpapers for this category for structured data
  const { data: wallpapers } = await supabase
    .from('wallpapers')
    .select('id, title, image_url, thumbnail_url, category, created_at')
    .eq('category', category.name)
    .limit(20)
    .order('created_at', { ascending: false })

  // Generate structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  const categoryUrl = `${baseUrl}/categories/${categorySlug}`
  
  const structuredData = generateCategoryStructuredData(category.name, wallpapers as WallpaperWithStats[] || [])
  
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Categories', url: `${baseUrl}/categories` },
    { name: category.name, url: categoryUrl }
  ]
  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <main className="flex-1">
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
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params
  const category = categories.find((cat) => cat.slug === categorySlug)

  if (!category) {
    return {
      title: "Category Not Found | WallpaperHub",
      description: "The requested category could not be found.",
    }
  }

  // Get wallpaper count for this category
  const { count } = await supabase
    .from('wallpapers')
    .select('*', { count: 'exact', head: true })
    .eq('category', category.name)

  return generateCategoryMetadata(category.name, count || 0)
}

// Force dynamic rendering to ensure real-time data
export const dynamic = 'force-dynamic'
export const revalidate = 0
