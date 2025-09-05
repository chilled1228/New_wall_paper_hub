'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Eye } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

interface RelatedPostsProps {
  currentPostId: string
  limit?: number
}

export function RelatedPosts({ currentPostId, limit = 4 }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${currentPostId}/related?limit=${limit}`)
        if (response.ok) {
          const posts = await response.json()
          setRelatedPosts(posts)
        }
      } catch (error) {
        console.error('Error fetching related posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedPosts()
  }, [currentPostId, limit])

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Related Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: limit }).map((_, index) => (
              <Card key={index} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Related Articles</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {relatedPosts.map((post) => (
            <RelatedPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface RelatedPostCardProps {
  post: BlogPost
}

function RelatedPostCard({ post }: RelatedPostCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link href={`/blog/${post.slug}`}>
        {post.featured_image_url && (
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="space-y-3">
            {post.categories && post.categories.length > 0 && (
              <div className="flex items-center gap-2">
                {post.categories.slice(0, 1).map((category) => (
                  <Badge 
                    key={category.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${category.color}20`, 
                      color: category.color,
                      border: `1px solid ${category.color}30`
                    }}
                  >
                    {category.name}
                  </Badge>
                ))}
                {post.featured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
              </div>
            )}

            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            
            {post.excerpt && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              
              {post.reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{post.reading_time}m</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{post.views}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}