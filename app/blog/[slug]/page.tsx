import { notFound } from 'next/navigation'
import { getPostBySlug, incrementViews, getAllPosts } from '@/lib/blog'
import { BlogPost } from '@/components/blog/blog-post'
import type { Metadata } from 'next'
import {
  generateBlogMetadata,
  generateBlogStructuredData,
  generateBreadcrumbStructuredData
} from '@/lib/seo-utils'

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: 'Post not found | WallpaperHub Blog',
      description: 'The requested blog post could not be found.',
    }
  }

  return generateBlogMetadata(post)
}

// Static generation with ISR for best SEO and performance
export const revalidate = 300 // Revalidate every 5 minutes

export async function generateStaticParams() {
  try {
    const posts = await getAllPosts('published')
    return posts.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post || post.status !== 'published') {
    notFound()
  }

  // Increment views (fire and forget)
  incrementViews(post.id).catch(console.error)

  // Generate structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'
  const postUrl = `${baseUrl}/blog/${post.slug}`
  
  const structuredData = generateBlogStructuredData(post)
  
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: postUrl }
  ]
  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <BlogPost post={post} />
    </>
  )
}