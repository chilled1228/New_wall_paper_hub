'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, Eye, ArrowLeft, Share2, Tag, User } from 'lucide-react'
import { RelatedPosts } from './related-posts'
import { CommentsSection } from './comments-section'
import type { BlogPost as BlogPostType } from '@/lib/blog'

interface BlogPostProps {
  post: BlogPostType
}

export function BlogPost({ post }: BlogPostProps) {
  useEffect(() => {
    // Apply styles directly to blog content elements after component mounts
    const blogContent = document.querySelector('.blog-content')
    if (blogContent) {
      const style = document.createElement('style')
      style.textContent = `
        .blog-content h1 {
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          color: hsl(var(--foreground)) !important;
          line-height: 1.2 !important;
          margin-top: 3rem !important;
          margin-bottom: 2rem !important;
        }
        .blog-content h2 {
          font-size: 2rem !important;
          font-weight: 700 !important;
          color: hsl(var(--foreground)) !important;
          line-height: 1.25 !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        .blog-content h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          color: hsl(var(--foreground)) !important;
          line-height: 1.3 !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
        }
        .blog-content p {
          font-size: 1.125rem !important;
          line-height: 1.75 !important;
          color: hsl(var(--muted-foreground)) !important;
          margin-bottom: 1.5rem !important;
        }
        .blog-content ul, .blog-content ol {
          font-size: 1.125rem !important;
          line-height: 1.75 !important;
          margin-bottom: 1.5rem !important;
          color: hsl(var(--muted-foreground)) !important;
        }
        .blog-content li {
          margin-bottom: 0.5rem !important;
        }
        .blog-content a {
          color: hsl(var(--brand-orange)) !important;
          text-decoration: none !important;
          font-weight: 500 !important;
        }
        .blog-content a:hover {
          text-decoration: underline !important;
        }
        .blog-content strong {
          font-weight: 700 !important;
          color: hsl(var(--foreground)) !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <>
      <article className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Back to Blog */}
        <Link href="/blog" className="inline-flex items-center text-brand-orange hover:text-brand-orange/80 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              {post.categories?.map((category) => (
                <span 
                  key={category.id}
                  className="px-3 py-1 bg-brand-orange/10 text-brand-orange text-sm font-medium rounded-full"
                >
                  {category.name}
                </span>
              ))}
              {post.featured && (
                <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange text-sm font-medium rounded-full">
                  ⭐ Featured
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {post.title}
            </h1>

            {post.featured_image_url && (
              <div className="aspect-video overflow-hidden rounded-lg">
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            )}

            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {post.author && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              {post.reading_time && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.reading_time} min read</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{post.views} views</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 pt-4">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Article
              </Button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <section className="mb-12">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 md:p-10 lg:p-12">
            <div
              className="blog-content max-w-none"
              style={{
                fontSize: '18px',
                lineHeight: '1.75',
                color: 'hsl(var(--muted-foreground))'
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </section>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag.id} className="px-2 py-1 bg-brand-blue-gray/10 text-brand-blue-gray text-xs rounded">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

      </article>
      
      {/* Related Posts */}
      <RelatedPosts currentPostId={post.id} />
      
      {/* Comments Section */}
      <CommentsSection postId={post.id} />
      
      {/* CTA Section - Outside article for full width */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <Card className="p-8 md:p-12 bg-brand-beige/20 dark:bg-brand-blue-gray/10 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">Ready to Try WallpaperHub?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover premium mobile wallpapers and transform your device with stunning designs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/categories">
              <Button className="bg-brand-orange hover:bg-brand-orange/90 text-lg px-8 py-3">
                Browse Categories
              </Button>
            </Link>
            <Link href="/popular">
              <Button variant="outline" className="text-lg px-8 py-3 border-brand-blue-gray text-brand-blue-gray hover:bg-brand-blue-gray hover:text-white">
                View Popular
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </>
  )
}