import { getAllPosts } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogHero } from '@/components/blog/blog-hero'

export const metadata = {
  title: 'Blog - WallpaperHub',
  description: 'Discover the latest trends, tips, and inspiration for mobile wallpapers and design.',
}

export default async function BlogPage() {
  const posts = await getAllPosts('published')

  return (
    <div className="min-h-screen">
      <BlogHero />
      
      <div className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No posts yet</h2>
            <p className="text-muted-foreground">
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}