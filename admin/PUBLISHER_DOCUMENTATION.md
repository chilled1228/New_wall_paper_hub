# WallpaperHub Python Publisher Documentation

> **⚠️ CRITICAL NOTICE**: This documentation is essential reading for anyone modifying the Python publishers or website slug/database system. Changes without following these guidelines will cause 404 errors and broken wallpaper links.

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Database Schema & UUID Handling](#database-schema--uuid-handling)
3. [Slug System & URL Generation](#slug-system--url-generation)
4. [Publisher Applications](#publisher-applications)
5. [Database RPC Functions](#database-rpc-functions)
6. [Development Guidelines](#development-guidelines)
7. [Troubleshooting](#troubleshooting)
8. [Setup & Configuration](#setup--configuration)

---

## System Architecture Overview

### Flow Diagram
```
Python Publisher → Supabase Database → Next.js Website → User
     ↓                    ↓                   ↓
1. Process Image     2. Store UUID      3. Generate Slug
2. Upload to R2      3. Create Stats    4. Find by Suffix
3. Insert Record     4. Return UUID     5. Display Page
```

### Key Components
- **Python Publishers**: Process and upload wallpapers
- **Supabase Database**: Stores wallpaper metadata with UUIDs
- **Next.js Frontend**: Generates SEO-friendly slugs and serves pages
- **Cloudflare R2**: Stores optimized images
- **PostgreSQL RPC**: Handles UUID suffix matching

---

## Database Schema & UUID Handling

### Core Tables

#### `wallpapers` table
```sql
- id: UUID (Primary Key, auto-generated)
- title: TEXT (Wallpaper title)
- description: TEXT (SEO description)
- category: TEXT (Category name)
- tags: TEXT[] (Array of tags)
- image_url: TEXT (Medium resolution URL)
- thumbnail_url: TEXT (150x200 URL)
- medium_url: TEXT (400x533 URL)  
- large_url: TEXT (720x960 URL)
- original_url: TEXT (Full quality URL)
- created_at: TIMESTAMPTZ (Auto-generated)
```

#### `wallpaper_stats` table
```sql
- id: UUID (Primary Key)
- wallpaper_id: UUID (Foreign Key to wallpapers.id)
- views: INTEGER (Default: 0)
- likes: INTEGER (Default: 0)
- downloads: INTEGER (Default: 0)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### UUID Handling Rules

#### ✅ CORRECT UUID Handling
```python
# INSERT wallpaper
result = supabase_client.table('wallpapers').insert(wallpaper_data).execute()

# Get the UUID from response
if result.data:
    wallpaper_id = result.data[0].get('id')  # ✅ CORRECT
    
    # Create stats entry
    stats_data = {
        'wallpaper_id': wallpaper_id,  # ✅ Use full UUID
        'views': 0,
        'likes': 0,
        'downloads': 0
    }
    supabase_client.table('wallpaper_stats').insert(stats_data).execute()
```

#### ❌ INCORRECT UUID Handling
```python
# DON'T do this - never truncate UUIDs in Python
wallpaper_id = str(uuid.uuid4())[:8]  # ❌ WRONG - causes foreign key errors

# DON'T assume specific UUID format
wallpaper_id = "custom-id-123"  # ❌ WRONG - must be proper UUID
```

---

## Slug System & URL Generation

### How Slug System Works

1. **Publisher stores wallpaper** with full UUID: `fb1ba331-7ec9-4a66-9b1d-a53dae84d111`
2. **Frontend generates slug** using last 8 chars: `ae84d111`  
3. **Slug format**: `category-title-shortid` → `art-happy-anniversary-phone-wallpaper-ae84d111`
4. **Detail page lookup**: Extracts `ae84d111` → Uses RPC function to find full UUID

### Critical RPC Function

```sql
-- This function MUST exist in database
CREATE OR REPLACE FUNCTION find_wallpapers_by_suffix(suffix_param TEXT)
RETURNS TABLE(id UUID)
LANGUAGE SQL STABLE AS $$
  SELECT w.id FROM wallpapers w
  WHERE w.id::text LIKE '%' || suffix_param
  LIMIT 5;
$$;
```

### TypeScript Integration
```typescript
// Frontend uses this to find wallpapers
const { data: wallpaperIds } = await supabase
  .rpc('find_wallpapers_by_suffix', { suffix_param: shortId })
```

### ⚠️ CRITICAL WARNINGS

1. **NEVER modify the slug generation logic** without updating the RPC function
2. **NEVER change UUID generation** in Python publishers
3. **NEVER use custom IDs** - always use Supabase auto-generated UUIDs
4. **NEVER truncate UUIDs** in database operations

---

## Publisher Applications

### 1. Batch Wallpaper Publisher (`batch_wallpaper_publisher.py`)
**Purpose**: Process entire folders of images with AI metadata generation

**Key Features**:
- Bulk processing with progress tracking
- Google Gemini AI integration for metadata
- Error handling per image
- Real-time UI updates

**Critical Code Sections**:
```python
# ✅ CORRECT title generation from filename
'title': image_path.stem.replace('_', ' ').replace('-', ' ').title()

# ✅ CORRECT UUID handling
wallpaper_id = result.data[0].get('id')
```

### 2. Wallpaper Publisher V3 (`wallpaper_publisher_v3.py`)
**Purpose**: Single wallpaper publishing with full control

**Key Features**:
- Individual image processing
- Manual metadata entry
- Preview functionality
- Advanced options

### 3. Image Processor (`image_processor.py`)
**Purpose**: Handle image optimization and SEO metadata injection

**Critical Settings**:
```python
# ✅ High quality settings for all resolutions
self.resolutions = {
    'thumbnail': {'width': 150, 'height': 200, 'quality': 95},
    'medium': {'width': 400, 'height': 533, 'quality': 95},
    'large': {'width': 720, 'height': 960, 'quality': 95},
    'original': {'width': None, 'height': None, 'quality': 95}
}
```

---

## Database RPC Functions

### Required Functions

#### 1. `find_wallpapers_by_suffix`
```sql
-- CRITICAL: This function MUST exist for slug system to work
CREATE OR REPLACE FUNCTION find_wallpapers_by_suffix(suffix_param TEXT)
RETURNS TABLE(id UUID)
LANGUAGE SQL STABLE AS $$
  SELECT w.id FROM wallpapers w
  WHERE w.id::text LIKE '%' || suffix_param
  LIMIT 5;
$$;
```

### Function Usage in Frontend
```typescript
// Used in: lib/slug-utils.ts, app/wallpaper/[slug]/page.tsx
const { data: matchingWallpapers } = await supabase
  .rpc('find_wallpapers_by_suffix', { suffix_param: shortId })
```

---

## Development Guidelines

### Before Making Changes

1. **Read this entire document** - No exceptions
2. **Test on development branch** - Never test on production
3. **Verify slug system works** - Check detail pages load correctly
4. **Test with batch publisher** - Ensure end-to-end flow works

### Code Standards

#### Python Publishers
```python
# ✅ ALWAYS use Path objects correctly
image_path.stem  # ✅ CORRECT
filename.stem    # ❌ WRONG - filename is string

# ✅ ALWAYS handle UUIDs properly  
wallpaper_id = result.data[0].get('id')  # ✅ CORRECT
wallpaper_id = result.data[0]['id'][:8]  # ❌ WRONG

# ✅ ALWAYS create stats entry
stats_data = {
    'wallpaper_id': wallpaper_id,  # Full UUID
    'views': 0, 'likes': 0, 'downloads': 0
}
```

#### Database Changes
```sql
-- ✅ ALWAYS use proper UUID operations
WHERE w.id::text LIKE '%' || suffix_param  -- ✅ CORRECT

-- ❌ NEVER use direct LIKE on UUID
WHERE w.id LIKE '%' || suffix_param  -- ❌ WRONG - causes operator errors
```

### Testing Checklist

- [ ] Publisher can process images without errors
- [ ] Images appear on home page after publishing
- [ ] Detail pages load correctly (no 404s)
- [ ] Slug generation works properly
- [ ] Database stats are created
- [ ] R2 upload succeeds
- [ ] SEO metadata is injected

---

## Troubleshooting

### Common Errors & Solutions

#### 1. `operator does not exist: uuid ~~ unknown`
**Cause**: Direct LIKE operation on UUID column  
**Solution**: Use RPC function `find_wallpapers_by_suffix`

```typescript
// ❌ WRONG - causes error
.filter('id', 'like', `%${shortId}`)

// ✅ CORRECT - use RPC
.rpc('find_wallpapers_by_suffix', { suffix_param: shortId })
```

#### 2. `'str' object has no attribute 'stem'`
**Cause**: Using `.stem` on string instead of Path object

```python
# ❌ WRONG
filename = image_path.name  # string
title = filename.stem       # ERROR

# ✅ CORRECT  
title = image_path.stem     # Path object
```

#### 3. Wallpapers appear on home page but 404 on detail page
**Cause**: RPC function missing or slug system broken

**Solution**: Verify RPC function exists
```sql
-- Run this query to check
SELECT * FROM pg_proc WHERE proname = 'find_wallpapers_by_suffix';
```

#### 4. Foreign key constraint errors in stats table
**Cause**: Using truncated UUID instead of full UUID

```python
# ❌ WRONG  
'wallpaper_id': wallpaper_id[:8]

# ✅ CORRECT
'wallpaper_id': wallpaper_id  # Full UUID from database
```

#### 5. Sitemap generation errors: `column wallpapers.updated_at does not exist`
**Cause**: Sitemap files referencing non-existent `updated_at` column

**Solution**: Use only `created_at` in sitemap queries
```typescript
// ❌ WRONG
.select('id, title, updated_at, created_at')

// ✅ CORRECT  
.select('id, title, created_at')
```

### Debug Steps

1. **Check database connection**:
   ```python
   result = supabase_client.table('wallpapers').select('id').limit(1).execute()
   print(result.data)
   ```

2. **Verify RPC function**:
   ```python
   result = supabase_client.rpc('find_wallpapers_by_suffix', {'suffix_param': 'ae84d111'}).execute()
   print(result.data)
   ```

3. **Test slug generation**:
   ```python
   from lib.slug_utils import generateWallpaperSlug
   slug = generateWallpaperSlug({'id': 'uuid-here', 'title': 'Test', 'category': 'art'})
   print(slug)
   ```

---

## Setup & Configuration

### Environment Variables Required
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url
GEMINI_API_KEY=your_gemini_key  # Optional for AI
```

### Python Dependencies
```bash
pip install -r requirements.txt
# Includes: supabase, boto3, pillow, google-generativeai, python-dotenv, etc.
```

### Database Setup
1. **Create RPC function** (see Database RPC Functions section)
2. **Enable RLS** on tables if needed
3. **Set up foreign keys** properly
4. **Create indexes** for performance

### First-Time Setup
1. Clone repository
2. Create `.env.local` with all required variables
3. Install Python dependencies
4. Run database migrations (if any)
5. Test with single image in Publisher V3
6. Scale up with Batch Publisher

---

## Important Notes for Developers

### DO NOT Change These Without Expert Review:
- UUID generation/handling system
- Slug generation algorithm  
- RPC function signatures
- Database foreign key relationships
- Image processor resolution settings

### Safe to Change:
- UI elements in publishers
- Image processing quality settings
- Category lists
- Default metadata values
- Progress indicators and logging

### Always Test These Scenarios:
1. Single image upload via Publisher V3
2. Batch processing via Batch Publisher
3. Home page displays new wallpapers
4. Detail pages load without 404
5. Stats tracking works properly

---

## Contact & Support

For issues with this system:
1. **Read this documentation fully**
2. **Check troubleshooting section**
3. **Test changes on development environment first**
4. **Document any changes you make**

**Remember**: The slug system and UUID handling are critical - errors here break the entire website's wallpaper browsing functionality.

---

*Last Updated: $(date)*  
*Version: 1.0*  
*Author: System Documentation Team*