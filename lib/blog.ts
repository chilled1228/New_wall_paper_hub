import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
  const { error } = await supabase
    .rpc('increment_blog_views', { post_id: id })

  if (error) {
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