import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Utility functions for blog processing
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

function extractKeywords(content: string, title: string): string[] {
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

// Load environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample categories to create
const categories = [
  {
    name: 'Design Trends',
    slug: 'design-trends',
    description: 'Latest trends in wallpaper design and mobile aesthetics',
    color: '#3B82F6'
  },
  {
    name: 'Mobile Tips',
    slug: 'mobile-tips',
    description: 'Tips and tricks for mobile customization',
    color: '#10B981'
  },
  {
    name: 'Artist Spotlight',
    slug: 'artist-spotlight',
    description: 'Featuring talented wallpaper artists and creators',
    color: '#F59E0B'
  }
]

// Sample tags to create
const tags = [
  { name: 'minimalist', slug: 'minimalist' },
  { name: 'nature', slug: 'nature' },
  { name: 'abstract', slug: 'abstract' },
  { name: 'mobile', slug: 'mobile' },
  { name: 'customization', slug: 'customization' },
  { name: 'design', slug: 'design' },
  { name: 'trends', slug: 'trends' },
  { name: 'wallpapers', slug: 'wallpapers' },
  { name: 'typography', slug: 'typography' },
  { name: 'gradient', slug: 'gradient' }
]

// Sample blog posts with rich HTML content
const blogPosts = [
  {
    title: 'The Rise of Minimalist Wallpapers: Why Less is More in 2024',
    excerpt: 'Discover how minimalist design is transforming mobile wallpapers and why simplicity is becoming the ultimate sophistication in digital aesthetics.',
    content: `
      <div class="blog-content">
        <h2>The Minimalist Revolution</h2>
        <p>In a world increasingly cluttered with visual noise, minimalist wallpapers have emerged as a breath of fresh air for mobile users seeking clarity and focus. The philosophy of "less is more" has never been more relevant than in our current digital landscape.</p>
        
        <h3>What Makes a Wallpaper Minimalist?</h3>
        <p>Minimalist wallpapers are characterized by:</p>
        <ul>
          <li><strong>Clean lines and geometric shapes</strong> - Simple forms that don't overwhelm the screen</li>
          <li><strong>Limited color palettes</strong> - Often monochromatic or using just 2-3 complementary colors</li>
          <li><strong>Ample negative space</strong> - White space that gives the design room to breathe</li>
          <li><strong>Subtle textures</strong> - Gentle gradients or patterns that add depth without distraction</li>
        </ul>
        
        <h3>The Psychology Behind Minimalism</h3>
        <p>Research shows that minimalist designs can reduce cognitive load and improve focus. When your phone's wallpaper is cluttered or busy, it creates visual stress every time you unlock your device. A clean, minimalist background allows your apps and content to take center stage.</p>
        
        <blockquote>
          "Simplicity is the ultimate sophistication." - Leonardo da Vinci
        </blockquote>
        
        <h3>Popular Minimalist Styles in 2024</h3>
        <p>This year, we're seeing several trending approaches to minimalist wallpaper design:</p>
        
        <h4>1. Gradient Horizons</h4>
        <p>Soft color transitions that mimic natural sunsets and sunrises, providing a calming backdrop that changes subtly throughout the day.</p>
        
        <h4>2. Geometric Abstractions</h4>
        <p>Simple geometric shapes in muted tones that create visual interest without overwhelming the screen real estate.</p>
        
        <h4>3. Monochromatic Typography</h4>
        <p>Single words or quotes in elegant typography against solid or subtly textured backgrounds.</p>
        
        <h3>How to Choose the Perfect Minimalist Wallpaper</h3>
        <p>When selecting a minimalist wallpaper, consider these factors:</p>
        <ol>
          <li><strong>Color harmony with your apps</strong> - Choose colors that complement your most-used app icons</li>
          <li><strong>Contrast for readability</strong> - Ensure text and icons remain clearly visible</li>
          <li><strong>Personal preference</strong> - The wallpaper should reflect your aesthetic sensibilities</li>
          <li><strong>Flexibility</strong> - Consider how the wallpaper looks in both light and dark modes</li>
        </ol>
        
        <h3>The Future of Minimalist Design</h3>
        <p>As we move forward, expect to see even more sophisticated approaches to minimalism, including adaptive wallpapers that change based on time of day, weather, or user activity. The key will be maintaining simplicity while adding intelligent, contextual elements.</p>
        
        <p>Minimalist wallpapers aren't just a trend—they're a return to intentional design that prioritizes user experience over visual excess. In our increasingly connected world, sometimes the most powerful design choice is knowing what to leave out.</p>
      </div>
    `,
    featured_image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=630&fit=crop',
    status: 'published' as const,
    author: 'Sarah Chen',
    featured: true,
    meta_title: 'Minimalist Wallpapers 2024: The Power of Simple Design',
    meta_description: 'Explore the rising trend of minimalist wallpapers and learn why simple, clean designs are becoming the preferred choice for mobile users in 2024.',
    categories: ['Design Trends'],
    tags: ['minimalist', 'design', 'trends', 'mobile']
  },
  {
    title: 'Nature-Inspired Wallpapers: Bringing the Outdoors to Your Phone Screen',
    excerpt: 'Explore how nature photography and botanical illustrations are creating stunning mobile wallpapers that connect us with the natural world.',
    content: `
      <div class="blog-content">
        <h2>The Call of the Wild</h2>
        <p>In our increasingly urbanized world, nature-inspired wallpapers serve as digital windows to the natural world. These designs don't just beautify our devices—they provide a moment of calm and connection in our busy digital lives.</p>
        
        <h3>Types of Nature Wallpapers</h3>
        <p>Nature wallpapers come in many forms, each offering a unique way to bring the outdoors to your screen:</p>
        
        <h4>Landscape Photography</h4>
        <p>High-resolution photographs of mountains, forests, oceans, and deserts capture the raw beauty of natural environments. These wallpapers often feature:</p>
        <ul>
          <li>Dramatic lighting conditions (golden hour, blue hour)</li>
          <li>Sweeping vistas that create depth</li>
          <li>Seasonal variations showcasing nature's cycles</li>
          <li>Weather phenomena like storms, fog, or aurora</li>
        </ul>
        
        <h4>Botanical Illustrations</h4>
        <p>Artistic interpretations of plants, flowers, and trees offer a more stylized approach to nature themes. These designs often incorporate:</p>
        <ul>
          <li>Watercolor techniques for soft, organic feels</li>
          <li>Line art for minimalist plant representations</li>
          <li>Pressed flower aesthetics for vintage appeal</li>
          <li>Tropical motifs for vibrant, energizing designs</li>
        </ul>
        
        <h3>The Science of Nature and Well-being</h3>
        <p>Research in environmental psychology shows that exposure to nature imagery can:</p>
        <blockquote>
          Reduce stress hormones, lower blood pressure, and improve overall mood and cognitive function.
        </blockquote>
        <p>While we can't always step outside, nature wallpapers provide a small but meaningful way to incorporate these benefits into our daily device interactions.</p>
        
        <h3>Seasonal Nature Wallpaper Trends</h3>
        <p>Many users enjoy changing their wallpapers with the seasons, creating a sense of connection to natural cycles:</p>
        
        <h4>Spring</h4>
        <p>Cherry blossoms, fresh green leaves, and wildflower meadows represent renewal and growth.</p>
        
        <h4>Summer</h4>
        <p>Ocean waves, sunflower fields, and forest canopies capture the energy and abundance of summer.</p>
        
        <h4>Autumn</h4>
        <p>Fall foliage, harvest scenes, and misty mornings evoke warmth and reflection.</p>
        
        <h4>Winter</h4>
        <p>Snow-covered landscapes, ice formations, and evergreen forests provide serene, contemplative imagery.</p>
        
        <h3>Creating Your Own Nature Collection</h3>
        <p>Building a personal collection of nature wallpapers can be a rewarding process:</p>
        <ol>
          <li><strong>Local inspiration</strong> - Photograph natural scenes in your area</li>
          <li><strong>Travel memories</strong> - Use nature photos from trips as wallpapers</li>
          <li><strong>Seasonal rotation</strong> - Create folders for different times of year</li>
          <li><strong>Mood matching</strong> - Choose images that reflect your current state of mind</li>
        </ol>
        
        <h3>Technical Considerations</h3>
        <p>When selecting nature wallpapers, keep these technical aspects in mind:</p>
        <ul>
          <li><strong>Resolution</strong> - Ensure images match your device's screen resolution</li>
          <li><strong>Composition</strong> - Consider how the image works with your app icons</li>
          <li><strong>Color balance</strong> - Choose images with good contrast for readability</li>
          <li><strong>File size</strong> - Optimize images to save storage space</li>
        </ul>
        
        <p>Nature wallpapers remind us that beauty exists everywhere, from the grandest mountain vista to the smallest flower petal. In our digital age, these images serve as gentle reminders to pause, breathe, and appreciate the natural world around us.</p>
      </div>
    `,
    featured_image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=630&fit=crop',
    status: 'published' as const,
    author: 'Marcus Rivera',
    featured: false,
    meta_title: 'Nature Wallpapers: Digital Windows to the Natural World',
    meta_description: 'Discover the beauty and psychological benefits of nature-inspired mobile wallpapers, from landscape photography to botanical illustrations.',
    categories: ['Design Trends'],
    tags: ['nature', 'wallpapers', 'design', 'mobile']
  },
  {
    title: 'Mobile Customization Guide: Personal Style',
    excerpt: 'Learn the art of mobile phone customization with wallpapers, themes, and design principles that reflect your unique personality and style.',
    content: `
      <div class="blog-content">
        <h2>Your Phone, Your Canvas</h2>
        <p>Your mobile phone is one of the most personal objects you own. It's with you constantly, reflecting your personality and style to both yourself and others. Learning to customize it effectively turns your device from a generic tool into a personalized extension of yourself.</p>
        
        <h3>The Foundation: Choosing the Right Wallpaper</h3>
        <p>Your wallpaper sets the tone for your entire mobile experience. It's the first thing you see when you unlock your phone and the backdrop for all your digital interactions.</p>
        
        <h4>Consider Your Lifestyle</h4>
        <ul>
          <li><strong>Professional users</strong> - Opt for subtle, sophisticated designs that won't distract during meetings</li>
          <li><strong>Creative individuals</strong> - Bold, artistic wallpapers that inspire and energize</li>
          <li><strong>Minimalists</strong> - Clean, simple designs that reduce visual clutter</li>
          <li><strong>Nature lovers</strong> - Landscapes and botanical designs that bring calm</li>
        </ul>
        
        <h3>Color Psychology in Mobile Design</h3>
        <p>Colors have profound psychological effects on our mood and behavior. Understanding color psychology can help you create a mobile experience that supports your goals:</p>
        
        <h4>Energizing Colors</h4>
        <p><strong>Red and Orange:</strong> Stimulate energy and motivation, perfect for productivity-focused users.</p>
        
        <h4>Calming Colors</h4>
        <p><strong>Blue and Green:</strong> Promote relaxation and focus, ideal for reducing digital stress.</p>
        
        <h4>Creative Colors</h4>
        <p><strong>Purple and Pink:</strong> Inspire creativity and imagination, great for artistic pursuits.</p>
        
        <h4>Professional Colors</h4>
        <p><strong>Gray and Navy:</strong> Convey sophistication and reliability, suitable for business use.</p>
        
        <h3>Advanced Customization Techniques</h3>
        <p>Beyond wallpapers, consider these customization elements:</p>
        
        <h4>Icon Organization</h4>
        <p>How you arrange your apps can significantly impact usability:</p>
        <ol>
          <li><strong>Frequency-based placement</strong> - Put most-used apps in easily accessible spots</li>
          <li><strong>Color coordination</strong> - Group apps by color for visual harmony</li>
          <li><strong>Categorical organization</strong> - Create folders for work, entertainment, utilities</li>
          <li><strong>Minimalist approach</strong> - Keep only essential apps on your home screen</li>
        </ol>
        
        <h4>Widget Strategy</h4>
        <p>Widgets can provide quick access to information without opening apps:</p>
        <ul>
          <li>Weather widgets for daily planning</li>
          <li>Calendar widgets for scheduling awareness</li>
          <li>Music controls for easy playback management</li>
          <li>Notes widgets for quick idea capture</li>
        </ul>
        
        <h3>Creating Themes and Consistency</h3>
        <p>A cohesive theme ties all elements together:</p>
        
        <blockquote>
          "Good design is about making other designers feel like idiots because that idea wasn't theirs." - Frank Chimero
        </blockquote>
        
        <h4>Design Principles to Follow</h4>
        <ul>
          <li><strong>Consistency</strong> - Use similar colors, fonts, and styles throughout</li>
          <li><strong>Balance</strong> - Distribute visual weight evenly across screens</li>
          <li><strong>Contrast</strong> - Ensure text and icons are easily readable</li>
          <li><strong>Hierarchy</strong> - Make important elements more prominent</li>
        </ul>
        
        <h3>Seasonal and Contextual Changes</h3>
        <p>Consider updating your customization based on:</p>
        <ul>
          <li><strong>Seasons</strong> - Reflect natural cycles in your design choices</li>
          <li><strong>Mood</strong> - Adapt your theme to match your current emotional state</li>
          <li><strong>Goals</strong> - Use motivational imagery during challenging periods</li>
          <li><strong>Events</strong> - Celebrate holidays or personal milestones</li>
        </ul>
        
        <h3>Avoiding Common Mistakes</h3>
        <p>Watch out for these customization pitfalls:</p>
        <ul>
          <li><strong>Over-customization</strong> - Too many elements can create visual chaos</li>
          <li><strong>Poor contrast</strong> - Beautiful wallpapers that make text unreadable</li>
          <li><strong>Ignoring functionality</strong> - Prioritizing looks over usability</li>
          <li><strong>Inconsistent updates</strong> - Mixing old and new design elements</li>
        </ul>
        
        <h3>Tools and Resources</h3>
        <p>Several tools can help you create and manage your mobile customization:</p>
        <ul>
          <li><strong>Wallpaper apps</strong> - For discovering new designs</li>
          <li><strong>Icon packs</strong> - For consistent app aesthetics</li>
          <li><strong>Launcher apps</strong> - For advanced customization options</li>
          <li><strong>Color palette generators</strong> - For creating harmonious color schemes</li>
        </ul>
        
        <p>Remember, mobile customization is a personal journey. What works for others might not work for you, and that's perfectly fine. The goal is to create a mobile experience that feels authentically yours and supports your daily digital interactions.</p>
        
        <p>Take time to experiment, and don't be afraid to change things up when your needs or preferences evolve. Your phone should grow and adapt with you, serving as both a functional tool and a reflection of your personal style.</p>
      </div>
    `,
    featured_image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=630&fit=crop',
    status: 'published' as const,
    author: 'Alex Thompson',
    featured: false,
    meta_title: 'Mobile Customization Guide: Personalize Your Device',
    meta_description: 'Master the art of mobile phone customization with expert tips on wallpapers, themes, colors, and design principles for a truly personal device.',
    categories: ['Mobile Tips'],
    tags: ['mobile', 'customization', 'design', 'wallpapers', 'trends']
  }
]

async function seedBlogContent() {
  console.log('🌱 Starting blog content seeding...')
  
  try {
    // Check if blog posts already exist
    const { data: existingPosts, error: checkError } = await supabase
      .from('blog_posts')
      .select('id, title')
      .limit(10)

    if (checkError) {
      console.error('❌ Error checking existing blog posts:', checkError)
      return
    }

    console.log(`📊 Found ${existingPosts?.length || 0} existing blog posts`)
    if (existingPosts && existingPosts.length > 0) {
      console.log('📋 Existing posts:')
      existingPosts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title} (${post.id})`)
      })
      console.log('📝 Found existing posts, but will add new ones...')
    }

    // Step 1: Create categories (skip if already exist)
    console.log('📂 Checking/creating blog categories...')
    const createdCategories: { [key: string]: string } = {}
    
    for (const category of categories) {
      // Check if category already exists
      const { data: existingCategory } = await supabase
        .from('blog_categories')
        .select('id, name')
        .eq('slug', category.slug)
        .single()

      if (existingCategory) {
        createdCategories[category.name] = existingCategory.id
        console.log(`✅ Found existing category: ${category.name}`)
        continue
      }

      // Create new category
      const { data, error } = await supabase
        .from('blog_categories')
        .insert([category])
        .select('id, name')
        .single()

      if (error) {
        console.error(`❌ Error creating category "${category.name}":`, error)
        continue
      }

      createdCategories[category.name] = data.id
      console.log(`✅ Created category: ${category.name}`)
    }

    // Step 2: Create tags (skip if already exist)
    console.log('🏷️ Checking/creating blog tags...')
    const createdTags: { [key: string]: string } = {}
    
    for (const tag of tags) {
      // Check if tag already exists
      const { data: existingTag } = await supabase
        .from('blog_tags')
        .select('id, name')
        .eq('slug', tag.slug)
        .single()

      if (existingTag) {
        createdTags[tag.name] = existingTag.id
        console.log(`✅ Found existing tag: ${tag.name}`)
        continue
      }

      // Create new tag
      const { data, error } = await supabase
        .from('blog_tags')
        .insert([tag])
        .select('id, name')
        .single()

      if (error) {
        console.error(`❌ Error creating tag "${tag.name}":`, error)
        continue
      }

      createdTags[tag.name] = data.id
      console.log(`✅ Created tag: ${tag.name}`)
    }

    // Step 3: Create blog posts
    console.log('📝 Creating blog posts...')
    
    for (const post of blogPosts) {
      // Generate additional fields
      const slug = generateSlug(post.title)
      const readingTime = calculateReadingTime(post.content)
      const keywords = extractKeywords(post.content, post.title)

      // Check if this specific post already exists
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id, title')
        .eq('slug', slug)
        .single()

      if (existingPost) {
        console.log(`⏩ Skipping existing post: ${post.title}`)
        continue
      }

      // Prepare post data
      const postData = {
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        featured_image_url: post.featured_image_url,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        status: post.status,
        author: post.author,
        reading_time: readingTime,
        keywords,
        featured: post.featured,
        views: 0,
        published_at: new Date().toISOString()
      }

      // Insert the post
      const { data: createdPost, error: postError } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select('id')
        .single()

      if (postError) {
        console.error(`❌ Error creating post "${post.title}":`, postError)
        continue
      }

      console.log(`✅ Created post: ${post.title}`)

      // Step 4: Link categories
      if (post.categories && post.categories.length > 0) {
        for (const categoryName of post.categories) {
          const categoryId = createdCategories[categoryName]
          if (categoryId) {
            const { error: categoryLinkError } = await supabase
              .from('blog_post_categories')
              .insert([{
                post_id: createdPost.id,
                category_id: categoryId
              }])

            if (categoryLinkError) {
              console.error(`❌ Error linking category "${categoryName}" to post:`, categoryLinkError)
            } else {
              console.log(`🔗 Linked category "${categoryName}" to post`)
            }
          }
        }
      }

      // Step 5: Link tags
      if (post.tags && post.tags.length > 0) {
        for (const tagName of post.tags) {
          const tagId = createdTags[tagName]
          if (tagId) {
            const { error: tagLinkError } = await supabase
              .from('blog_post_tags')
              .insert([{
                post_id: createdPost.id,
                tag_id: tagId
              }])

            if (tagLinkError) {
              console.error(`❌ Error linking tag "${tagName}" to post:`, tagLinkError)
            } else {
              console.log(`🔗 Linked tag "${tagName}" to post`)
            }
          }
        }
      }
    }

    // Verify the results
    const { count, error: countError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`📊 Total blog posts in database: ${count}`)
    }

    console.log('🎉 Blog content seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during blog seeding:', error)
  }
}

// Run the seeding function
seedBlogContent()
  .then(() => {
    console.log('✅ Blog seeding process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Blog seeding process failed:', error)
    process.exit(1)
  })