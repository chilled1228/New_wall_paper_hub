# Blog Admin Interface

A simple, secure admin interface for managing blog posts with HTML content support.

## Features

### 🔐 Authentication
- Environment-based credentials (username/password stored in `.env.local`)
- JWT-based session management
- Protected admin routes with middleware
- 24-hour session timeout

### 📝 Blog Post Management
- **Create**: Simple form for creating new blog posts
- **Read**: List all posts with filtering and search
- **Update**: Edit existing posts with live preview
- **Delete**: Remove posts with confirmation

### 🛡️ HTML Processing
- **Sanitization**: Automatic removal of dangerous HTML elements (scripts, forms)
- **Validation**: Content validation with helpful error messages
- **Auto-processing**: Automatic excerpt generation and read time calculation
- **Safe Elements**: Supports headings, paragraphs, links, images, lists, tables

### 🎨 User Interface
- **Minimal Design**: Clean, functional interface focused on usability
- **Responsive**: Works on desktop and mobile devices
- **Dark/Light Mode**: Supports system theme preferences
- **Intuitive Navigation**: Simple sidebar navigation

## Quick Start

### 1. Set Up Credentials
The admin credentials are stored in your `.env.local` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please

# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Important**: Change these credentials before deploying to production!

### 2. Access Admin Interface
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin`
3. Login with your credentials
4. Start managing your blog posts!

## Usage Guide

### Creating Blog Posts

1. **Navigate to New Post**
   - Click "New Post" from dashboard or sidebar
   - Or go directly to `/admin/posts/new`

2. **Fill in Basic Information**
   - **Title**: Enter your blog post title
   - **Slug**: Auto-generated from title (editable)
   - **Excerpt**: Brief description for previews

3. **Add HTML Content**
   - Paste your pre-formatted HTML in the large text area
   - The system will automatically:
     - Sanitize dangerous elements
     - Generate read time
     - Extract keywords
     - Create excerpt if not provided

4. **Configure Settings**
   - **Status**: Draft, Published, or Archived
   - **Category**: Organize your posts
   - **Tags**: Comma-separated tags
   - **Featured**: Mark as featured post
   - **Author**: Post author name

5. **SEO & Metadata**
   - **Meta Description**: For search engines
   - **Keywords**: SEO keywords

6. **Save or Publish**
   - Save as draft for later editing
   - Publish immediately
   - Preview before publishing

### Managing Existing Posts

1. **View All Posts**
   - Go to `/admin/posts`
   - See all posts with status, author, category
   - Filter by status or search by title/author

2. **Edit Posts**
   - Click edit button on any post
   - Make changes and save
   - All content is re-processed on save

3. **Delete Posts**
   - Click delete button with confirmation
   - Permanently removes the post

### HTML Content Guidelines

#### ✅ Supported Elements
- **Headings**: `<h1>` through `<h6>`
- **Text**: `<p>`, `<span>`, `<div>`
- **Formatting**: `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`
- **Links**: `<a href="...">` with title and target attributes
- **Images**: `<img src="..." alt="...">` with dimensions
- **Lists**: `<ul>`, `<ol>`, `<li>`
- **Tables**: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- **Code**: `<pre>`, `<code>` with class attributes
- **Quotes**: `<blockquote>`
- **Separators**: `<hr>`

#### ❌ Automatically Removed
- **Scripts**: `<script>` tags and JavaScript
- **Forms**: `<form>`, `<input>`, `<button>` elements
- **Dangerous attributes**: `onclick`, `onload`, etc.
- **Embedded content**: `<iframe>`, `<object>`, `<embed>`

#### 💡 Best Practices
- Always include `alt` attributes for images
- Use semantic HTML elements
- Include proper heading hierarchy
- Add `title` attributes for links
- Keep content well-structured

## File Structure

```
app/admin/                 # Admin interface pages
├── login/page.tsx         # Login page
├── posts/                 # Post management
│   ├── page.tsx          # Posts list
│   ├── new/page.tsx      # Create new post
│   └── [id]/edit/page.tsx # Edit existing post
├── settings/page.tsx      # Settings page
├── page.tsx              # Dashboard
└── layout.tsx            # Admin layout

components/admin/          # Admin components
├── AdminHeader.tsx        # Header with logout
├── AdminSidebar.tsx       # Navigation sidebar
└── BlogPostForm.tsx       # Post creation/editing form

lib/                       # Utilities
├── auth.ts               # Authentication functions
├── blog-storage.ts       # File-based storage
└── html-processor.ts     # HTML sanitization

data/
└── blog-posts.json       # Blog posts storage file
```

## Security Features

- **Authentication**: Environment-based credentials
- **Authorization**: JWT tokens with expiration
- **Route Protection**: Middleware guards admin routes
- **HTML Sanitization**: DOMPurify removes dangerous content
- **Input Validation**: Server-side validation for all inputs
- **CSRF Protection**: Built-in Next.js protections

## Storage System

The admin interface now uses Supabase database storage:

- **Database**: PostgreSQL via Supabase
- **Table**: `blog_posts` with proper indexes and RLS policies
- **Backup**: Automated Supabase backups with point-in-time recovery
- **Scalability**: Highly scalable with global distribution
- **Performance**: Optimized queries with database indexes

### Migration from File Storage

If migrating from the previous file-based system, see `SUPABASE_MIGRATION.md` for detailed instructions.

## Deployment Notes

### Environment Variables
Ensure these are set in production:

```env
ADMIN_USERNAME=your-secure-username
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=a-very-long-random-secret-key
NODE_ENV=production
```

### Security Checklist
- [ ] Change default admin credentials
- [ ] Use a strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Regular backups of blog-posts.json
- [ ] Monitor for unauthorized access attempts

## Troubleshooting

### Login Issues
- Check `.env.local` has correct credentials
- Verify JWT_SECRET is set
- Clear browser cookies and try again

### Post Creation Issues
- Ensure `data/` directory exists and is writable
- Check HTML content for validation errors
- Verify all required fields are filled

### Permission Issues
- Check file system permissions for `data/` directory
- Ensure Next.js can read/write to the data file

## Support

This admin interface is designed to be simple and self-contained. For issues:

1. Check the browser console for errors
2. Review the server logs
3. Verify environment variables are set correctly
4. Test with a minimal HTML post first
