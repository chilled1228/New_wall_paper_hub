import { notFound } from 'next/navigation'
import { getPostBySlug, incrementViews, getAllPosts } from '@/lib/blog'
import { BlogPost } from '@/components/blog/blog-post'
import type { Metadata } from 'next'

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
      title: 'Post not found',
    }
  }

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ''
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/blog/${post.slug}`
  
  return {
    title,
    description,
    keywords: post.keywords?.join(', ') || '',
    authors: [{ name: post.author || 'WallpaperHub' }],
    creator: post.author || 'WallpaperHub',
    publisher: 'WallpaperHub',
    alternates: {
      canonical: post.canonical_url || url,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: 'WallpaperHub',
      publishedTime: post.published_at || undefined,
      authors: [post.author || 'WallpaperHub'],
      images: post.featured_image_url ? [{
        url: post.featured_image_url,
        width: 1200,
        height: 630,
        alt: title,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@wallpaperhub',
      creator: '@wallpaperhub',
      title,
      description,
      images: post.featured_image_url ? [{
        url: post.featured_image_url,
        alt: title,
      }] : [],
    },
    robots: {
      index: post.status === 'published',
      follow: true,
      googleBot: {
        index: post.status === 'published',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
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

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wallpaperhub.com'}/blog/${post.slug}`
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    image: post.featured_image_url ? [{
      '@type': 'ImageObject',
      url: post.featured_image_url,
      width: 1200,
      height: 630,
    }] : undefined,
    author: {
      '@type': 'Person',
      name: post.author || 'WallpaperHub',
    },
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
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: post.keywords?.join(', ') || '',
    articleSection: 'Wallpapers',
    wordCount: post.content ? post.content.split(' ').length : 0,
    timeRequired: `PT${post.reading_time || 5}M`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPost post={post} />
    </>
  )
}