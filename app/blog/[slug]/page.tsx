import { notFound } from 'next/navigation'
import { getPostBySlug, incrementViews, getAllPosts } from '@/lib/blog'
import { BlogPost } from '@/components/blog/blog-post'
import type { Metadata } from 'next'

interface Props {
  params: {
    slug: string
  }
}

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: 'Post not found',
    }
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || '',
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
  }
}

export const revalidate = 3600 // Revalidate every hour

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post || post.status !== 'published') {
    notFound()
  }

  // Increment views (fire and forget)
  incrementViews(post.id).catch(console.error)

  return <BlogPost post={post} />
}