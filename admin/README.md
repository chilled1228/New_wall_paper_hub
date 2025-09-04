# Wallpaper Admin System

A comprehensive Python-based administration suite for managing your wallpaper website with automatic image optimization, AI-powered metadata generation, and database management tools.

## 🌟 Features

### 📤 Wallpaper Publisher V2
- **Automatic Image Optimization**: Generates 4 resolutions (thumbnail, medium, large, original)
- **AI Metadata Generation**: Uses Google Gemini to auto-generate titles, descriptions, and tags
- **Multiple Format Support**: JPEG, PNG, HEIC, WebP, and more
- **Cloud Storage Integration**: Direct upload to Cloudflare R2
- **SEO-Friendly URLs**: Automatic slug generation matching website structure
- **Real-time Preview**: Live preview of all generated resolutions

### 📊 Admin Dashboard
- **Analytics Overview**: View downloads, likes, views, and user interactions
- **Wallpaper Management**: Browse, search, and manage all wallpapers
- **Bulk Operations**: Delete, categorize, and export multiple wallpapers
- **Real-time Activity**: Monitor recent user interactions
- **Database Health**: View database statistics and health metrics

### 🗄️ Database Management
- **Health Checks**: Comprehensive database validation and integrity checks
- **Backup & Restore**: Full database backups with easy restoration
- **Data Cleanup**: Remove old interactions and orphaned records  
- **Performance Optimization**: Fix missing stats and optimize queries
- **Data Export**: Export data to CSV or JSON formats

### 🖼️ Image Processing Engine
- **Smart Resizing**: Maintains aspect ratios with quality optimization
- **Format Optimization**: Converts all images to optimized JPEG
- **Batch Processing**: Process multiple images simultaneously
- **Quality Control**: Different quality settings per resolution
- **Preview Generation**: HTML previews of processed images

## 📁 Project Structure

```
admin/
├── launcher.py              # Main launcher GUI
├── wallpaper_publisher_v2.py # Enhanced publisher with optimization
├── admin_dashboard.py       # Admin dashboard interface
├── database_manager.py      # Database management tools
├── image_processor.py       # Image processing engine
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd admin
pip install -r requirements.txt
```

### 2. Configure Environment

Ensure your `.env.local` file (in the parent directory) contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket-url.com

# Google Gemini API (Optional, for AI metadata)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Launch the Admin System

```bash
python launcher.py
```

This opens the main launcher where you can access all admin tools.

## 🛠️ Individual Tools

### Wallpaper Publisher V2

```bash
python wallpaper_publisher_v2.py
```

**Features:**
- Select and validate wallpaper images
- Automatic image processing (4 resolutions)
- AI metadata generation with Gemini
- Preview all generated resolutions
- Direct upload to cloud storage
- Database integration with proper URLs

### Admin Dashboard

```bash
python admin_dashboard.py
```

**Features:**
- Overview with key statistics
- Wallpaper management with search/filter
- Recent activity monitoring
- Bulk operations (delete, categorize)
- Database health information
- Maintenance tools

### Database Manager (CLI)

```bash
# Health check
python database_manager.py health

# Create backup
python database_manager.py backup

# List backups
python database_manager.py list-backups

# Validate data
python database_manager.py validate

# Clean old interactions (365+ days)
python database_manager.py cleanup --days 365

# Fix missing stats
python database_manager.py fix-stats

# Export data
python database_manager.py export --format csv
```

### Image Processor (CLI)

```bash
# Process single image
python image_processor.py image.jpg

# Process multiple images
python image_processor.py *.jpg

# Process with HTML preview
python image_processor.py --preview image.jpg

# Clean old processed files (keep 50 recent)
python image_processor.py --clean 50
```

## 📊 Image Optimization Details

The system generates 4 optimized versions of each image:

| Resolution | Size | Quality | Use Case |
|-----------|------|---------|----------|
| **Thumbnail** | 150×200px | 60% | Grid previews, fast loading |
| **Medium** | 400×533px | 75% | List views, mobile displays |
| **Large** | 800×1067px | 85% | Desktop previews |
| **Original** | Full size | 95% | Downloads, high-quality viewing |

### Optimization Features:
- **Progressive JPEG**: For large/original images
- **Smart cropping**: Maintains focus on image center
- **Quality enhancement**: Sharpening and contrast adjustment
- **Format standardization**: All outputs in optimized JPEG
- **Aspect ratio preservation**: No distortion

## 🔧 Database Schema

The system works with these database tables:

### `wallpapers`
- Basic wallpaper information
- Multiple resolution URLs
- SEO metadata (title, description, tags)
- Category and creation timestamp

### `wallpaper_stats`
- Download, like, and view counts
- Auto-updated via database triggers
- Performance metrics

### `user_interactions`
- Individual user actions (view/like/download)
- Session-based tracking
- IP address for analytics
- Timestamp for activity analysis

## 🎯 Best Practices

### Image Upload Workflow:
1. **Select Image**: Choose high-quality portrait wallpapers (min 1200×1600px)
2. **Process Image**: Generate all resolutions automatically
3. **AI Metadata**: Use Gemini to generate SEO-optimized metadata
4. **Review & Edit**: Customize title, description, tags, and category
5. **Publish**: Upload to cloud storage and save to database

### Database Maintenance:
- Run health checks weekly: `python database_manager.py health`
- Create backups regularly: `python database_manager.py backup`
- Clean old interactions monthly: `python database_manager.py cleanup`
- Fix missing stats as needed: `python database_manager.py fix-stats`

### Performance Tips:
- Process images in batches during off-peak hours
- Use the dashboard to monitor popular wallpapers
- Regular cleanup keeps the database performant
- Monitor storage usage in Cloudflare R2

## 🚨 Troubleshooting

### Common Issues:

**"Missing required package" error:**
```bash
pip install -r requirements.txt
```

**".env.local file not found" error:**
- Ensure `.env.local` exists in the parent directory
- Check all required environment variables are set

**"Failed to connect to database" error:**
- Verify Supabase URL and API key
- Check internet connection
- Ensure Supabase project is active

**"Image processing failed" error:**
- Check image file format (should be standard image format)
- Ensure image is not corrupted
- Verify image dimensions (minimum 100×100px)

**"Upload to R2 failed" error:**
- Verify Cloudflare R2 credentials
- Check bucket name and permissions
- Ensure R2 bucket allows uploads

### Getting Help:

1. **Check Logs**: The dashboard shows detailed error logs
2. **Validate Environment**: Use the launcher to check configuration
3. **Run Health Check**: `python database_manager.py health`
4. **Check Database**: Use the dashboard to view database status

## 📈 Monitoring & Analytics

The admin system provides comprehensive monitoring:

- **Real-time Statistics**: Downloads, likes, views
- **User Activity**: Recent interactions and trends
- **Database Health**: Record counts, data integrity
- **Performance Metrics**: Popular wallpapers, category distribution
- **Storage Usage**: Track uploaded file sizes

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env.local` to version control
- **API Keys**: Keep Supabase and Gemini API keys secure
- **Database Access**: Use row-level security (RLS) in production
- **File Uploads**: Validate image formats and file sizes
- **User Privacy**: Session-based tracking, no personal data stored

## 🎨 Customization

### Adding New Categories:
1. Update category lists in `wallpaper_publisher_v2.py`
2. Update validation in `database_manager.py`
3. Add new category to the website frontend

### Modifying Image Resolutions:
1. Edit `resolutions` dict in `image_processor.py`
2. Update database schema to include new URL fields
3. Modify frontend components to use new resolutions

### Custom AI Prompts:
1. Edit the prompt in `wallpaper_publisher_v2.py`
2. Modify metadata parsing logic if needed
3. Test with various image types

This admin system provides everything needed to manage a professional wallpaper website with optimized performance and user experience! 🚀