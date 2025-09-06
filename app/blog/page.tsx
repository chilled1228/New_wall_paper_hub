import { getAllPosts } from '@/lib/blog'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogHero } from '@/components/blog/blog-hero'
import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Blog - WallpaperHub',
  description: 'Discover the latest trends, tips, and inspiration for mobile wallpapers and design.',
}

// Dynamic with short revalidation for good SEO and speed
export const revalidate = 60 // Revalidate every minute for fresh content

export default async function BlogPage() {
  const posts = await getAllPosts('published')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'WallpaperHub Blog',
    description: 'Discover the latest trends, tips, and inspiration for mobile wallpapers and design.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'WallpaperHub',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/logo.png`,
        width: 200,
        height: 60,
      },
    },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || '',
      author: {
        '@type': 'Person',
        name: post.author || 'WallpaperHub',
      },
      datePublished: post.published_at,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/blog/${post.slug}`,
      image: post.featured_image_url,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <BlogHero />
        
        <div className="container mx-auto px-4 py-12 flex-1">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No posts yet</h2>
              <p className="text-muted-foreground">
                Check back soon for new content!
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <BlogCard 
                  key={post.id} 
                  post={post} 
                  priority={index < 6} // Priority loading for first 6 posts
                />
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  )
}