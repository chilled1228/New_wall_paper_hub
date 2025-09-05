import { createClient } from '@supabase/supabase-js'
import type { BlogComment, BlogCommentWithReplies, BlogCommentInsert } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image_url?: string
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  keywords?: string[]
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  author?: string
  reading_time?: number
  views: number
  featured: boolean
  created_at: string
  updated_at: string
  categories?: Array<{
    id: string
    name: string
    slug: string
    color: string
  }>
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
}

export type BlogCategory = {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  created_at: string
}

export type BlogTag = {
  id: string
  name: string
  slug: string
  created_at: string
}

// Blog Posts
export async function getAllPosts(status?: string): Promise<BlogPost[]> {
  let query = supabase
    .from('blog_posts')
    .select(`
      *,
      blog_post_categories(
        blog_categories(id, name, slug, color)
      ),
      blog_post_tags(
        blog_tags(id, name, slug)
      )
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data?.map(post => ({
    ...post,
    categories: post.blog_post_categories?.map((pc: any) => pc.blog_categories) || [],
    tags: post.blog_post_tags?.map((pt: any) => pt.blog_tags) || []
  })) || []
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    console.log('Fetching post with slug:', slug)
    
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_post_categories(
          blog_categories(id, name, slug, color)
        ),
        blog_post_tags(
          blog_tags(id, name, slug)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Supabase error fetching post:', error)
      return null
    }

    if (!data) {
      console.log('No data found for slug:', slug)
      return null
    }

    console.log('Found post:', data.title)
    
    return {
      ...data,
      categories: data.blog_post_categories?.map((pc: any) => pc.blog_categories) || [],
      tags: data.blog_post_tags?.map((pt: any) => pt.blog_tags) || []
    }
  } catch (error) {
    console.error('Unexpected error fetching post:', error)
    return null
  }
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_post_categories(
        blog_categories(id, name, slug, color)
      ),
      blog_post_tags(
        blog_tags(id, name, slug)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  if (!data) return null

  return {
    ...data,
    categories: data.blog_post_categories?.map((pc: any) => pc.blog_categories) || [],
    tags: data.blog_post_tags?.map((pt: any) => pt.blog_tags) || []
  }
}

export async function createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([{
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image_url: post.featured_image_url,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      canonical_url: post.canonical_url,
      keywords: post.keywords,
      status: post.status,
      published_at: post.status === 'published' ? new Date().toISOString() : null,
      author: post.author,
      reading_time: post.reading_time,
      featured: post.featured
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return null
  }

  return data?.id || null
}

export async function updatePost(id: string, post: Partial<BlogPost>): Promise<boolean> {
  const updateData: any = { ...post }
  
  // Set published_at when status changes to published
  if (post.status === 'published' && !post.published_at) {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating post:', error)
    return false
  }

  return true
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting post:', error)
    return false
  }

  return true
}

export async function incrementViews(id: string): Promise<void> {
  try {
    // First get the current views count
    const { data: currentPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('views')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching current views:', fetchError)
      return
    }

    // Increment and update
    const newViews = (currentPost?.views || 0) + 1
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        views: newViews,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error incrementing views:', error)
    }
  } catch (error) {
    console.error('Error incrementing views:', error)
  }
}

// Categories
export async function getAllCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

export async function createCategory(category: Omit<BlogCategory, 'id' | 'created_at'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('blog_categories')
    .insert([category])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return null
  }

  return data?.id || null
}

// Tags
export async function getAllTags(): Promise<BlogTag[]> {
  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  return data || []
}

export async function createTag(tag: Omit<BlogTag, 'id' | 'created_at'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('blog_tags')
    .insert([tag])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating tag:', error)
    return null
  }

  return data?.id || null
}

// Utility functions
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function extractKeywords(content: string, title: string): string[] {
  const text = (title + ' ' + content).toLowerCase()
  const words = text.match(/\b\w{4,}\b/g) || []
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

// Related Posts Functions
export async function getRelatedPosts(postId: string, limit: number = 4): Promise<BlogPost[]> {
  try {
    // First get the current post to find its categories and tags
    const { data: currentPost, error: currentPostError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        blog_post_categories(
          blog_categories(id, name, slug)
        ),
        blog_post_tags(
          blog_tags(id, name, slug)
        )
      `)
      .eq('id', postId)
      .single()

    if (currentPostError || !currentPost) {
      console.error('Error fetching current post for related posts:', currentPostError)
      return []
    }

    // Extract category and tag IDs
    const categoryIds = currentPost.blog_post_categories?.map((pc: any) => pc.blog_categories.id) || []
    const tagIds = currentPost.blog_post_tags?.map((pt: any) => pt.blog_tags.id) || []

    // Build a query to find related posts
    let relatedPosts: BlogPost[] = []

    // Strategy 1: Find posts with matching categories
    if (categoryIds.length > 0) {
      const { data: categoryMatches } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories!inner(
            blog_categories(id, name, slug, color)
          ),
          blog_post_tags(
            blog_tags(id, name, slug)
          )
        `)
        .in('blog_post_categories.category_id', categoryIds)
        .neq('id', postId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit * 2) // Get more to filter duplicates

      if (categoryMatches) {
        relatedPosts = categoryMatches.map(post => ({
          ...post,
          categories: post.blog_post_categories?.map((pc: any) => pc.blog_categories) || [],
          tags: post.blog_post_tags?.map((pt: any) => pt.blog_tags) || []
        }))
      }
    }

    // Strategy 2: If we don't have enough posts, find posts with matching tags
    if (relatedPosts.length < limit && tagIds.length > 0) {
      const excludeIds = [postId, ...relatedPosts.map(p => p.id)]
      
      const { data: tagMatches } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories(
            blog_categories(id, name, slug, color)
          ),
          blog_post_tags!inner(
            blog_tags(id, name, slug)
          )
        `)
        .in('blog_post_tags.tag_id', tagIds)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (tagMatches) {
        const tagMatchPosts = tagMatches.map(post => ({
          ...post,
          categories: post.blog_post_categories?.map((pc: any) => pc.blog_categories) || [],
          tags: post.blog_post_tags?.map((pt: any) => pt.blog_tags) || []
        }))
        
        relatedPosts = [...relatedPosts, ...tagMatchPosts]
      }
    }

    // Strategy 3: If still not enough, get latest posts from same author or just latest
    if (relatedPosts.length < limit) {
      const excludeIds = [postId, ...relatedPosts.map(p => p.id)]
      
      const { data: latestPosts } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories(
            blog_categories(id, name, slug, color)
          ),
          blog_post_tags(
            blog_tags(id, name, slug)
          )
        `)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (latestPosts) {
        const latestPostsFormatted = latestPosts.map(post => ({
          ...post,
          categories: post.blog_post_categories?.map((pc: any) => pc.blog_categories) || [],
          tags: post.blog_post_tags?.map((pt: any) => pt.blog_tags) || []
        }))
        
        relatedPosts = [...relatedPosts, ...latestPostsFormatted]
      }
    }

    // Remove duplicates and limit results
    const uniquePosts = relatedPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    )

    return uniquePosts.slice(0, limit)
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

// Comments Functions
export async function getPostComments(postId: string): Promise<BlogCommentWithReplies[]> {
  try {
    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    if (!comments) return []

    // Build comment tree (comments with replies)
    const commentMap = new Map<string, BlogCommentWithReplies>()
    const rootComments: BlogCommentWithReplies[] = []

    // First pass: create comment objects with empty replies arrays
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: build the tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      
      if (comment.parent_id) {
        // This is a reply
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies!.push(commentWithReplies)
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

export async function createComment(comment: BlogCommentInsert): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .insert([comment])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error creating comment:', error)
    return null
  }
}

export async function getCommentCount(postId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('status', 'approved')

    if (error) {
      console.error('Error getting comment count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting comment count:', error)
    return 0
  }
}