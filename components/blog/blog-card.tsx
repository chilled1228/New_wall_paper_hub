import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Eye } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/blog/${post.slug}`}>
        {post.featured_image_url && (
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {post.categories?.slice(0, 2).map((category) => (
              <Badge 
                key={category.id} 
                variant="secondary"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </Badge>
            ))}
            {post.featured && (
              <Badge variant="default">Featured</Badge>
            )}
          </div>
          
          <h2 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
            {post.title}
          </h2>
          
          {post.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString()}
            </div>
            
            {post.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.reading_time} min read
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.views}
            </div>
          </div>
          
          {post.author && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                By {post.author}
              </p>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}