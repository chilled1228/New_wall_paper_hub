#!/usr/bin/env python3
"""
Image Processing Module
Handles image optimization, resizing, and format conversion for wallpapers
Generates multiple resolutions: thumbnail, medium, large, and original
"""

import os
import sys
from pathlib import Path
from typing import Dict, Tuple, Optional, List
import hashlib
import json
from datetime import datetime

from PIL import Image, ImageFilter, ImageEnhance
from PIL.ExifTags import TAGS
import pillow_heif
import piexif
from iptcinfo3 import IPTCInfo

class ImageProcessor:
    """Handles all image processing operations"""
    
    def __init__(self, output_dir: str = "processed_images"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Register HEIF opener with Pillow (for iPhone photos)
        pillow_heif.register_heif_opener()
        
        # Resolution configurations - thumbnail for grid, medium for preview, large for detail, original for download
        # Maximum quality settings (95%) for all WebP resolutions
        self.resolutions = {
            'thumbnail': {'width': 150, 'height': 200, 'quality': 95},  # Maximum quality
            'medium': {'width': 400, 'height': 533, 'quality': 95},     # Maximum quality
            'large': {'width': 720, 'height': 960, 'quality': 95},      # Maximum quality
            'original': {'width': None, 'height': None, 'quality': 95}  # Keep original size
        }
        
        # Supported formats
        self.supported_formats = {
            '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp', '.heic', '.heif'
        }
    
    def validate_image(self, image_path: str) -> Tuple[bool, str]:
        """
        Validate if the image is supported and accessible
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            path = Path(image_path)
            
            # Check if file exists
            if not path.exists():
                return False, "File does not exist"
            
            # Check file extension
            if path.suffix.lower() not in self.supported_formats:
                return False, f"Unsupported format. Supported: {', '.join(self.supported_formats)}"
            
            # Try to open the image
            with Image.open(path) as img:
                # Check if it's actually an image
                img.verify()
            
            # Reopen for size check (verify() closes the image)
            with Image.open(path) as img:
                width, height = img.size
                
                # Check minimum dimensions
                if width < 100 or height < 100:
                    return False, "Image too small (minimum 100x100px)"
                
                # Check aspect ratio (should be roughly portrait for wallpapers)
                aspect_ratio = height / width
                if aspect_ratio < 1.2:  # Less portrait than 4:5 ratio
                    return False, "Image should be in portrait orientation (height > width * 1.2)"
            
            return True, "Valid image"
            
        except Exception as e:
            return False, f"Invalid image: {str(e)}"
    
    def get_image_info(self, image_path: str) -> Dict:
        """
        Get detailed information about the image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with image information
        """
        try:
            with Image.open(image_path) as img:
                return {
                    'filename': Path(image_path).name,
                    'format': img.format,
                    'mode': img.mode,
                    'size': img.size,
                    'width': img.size[0],
                    'height': img.size[1],
                    'aspect_ratio': img.size[1] / img.size[0],
                    'file_size': os.path.getsize(image_path),
                    'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info
                }
        except Exception as e:
            return {'error': str(e)}
    
    def generate_filename(self, original_path: str, resolution: str) -> str:
        """
        Generate optimized filename with hash for uniqueness
        
        Args:
            original_path: Original file path
            resolution: Resolution type (thumbnail, medium, large, original)
            
        Returns:
            Generated filename
        """
        # Create hash from file content for uniqueness
        with open(original_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()[:8]
        
        # Get timestamp
        timestamp = datetime.now().strftime('%Y%m%d')
        
        # Generate filename - WebP for display resolutions, original format preserved for download
        original_ext = Path(original_path).suffix.lower()
        
        if resolution == 'original':
            # Keep original format for download
            if original_ext in ['.heic', '.heif']:
                # Convert HEIC/HEIF to JPG for compatibility
                filename = f"wallpaper_{timestamp}_{file_hash}.jpg"
            else:
                # Keep original format
                filename = f"wallpaper_{timestamp}_{file_hash}{original_ext}"
        else:
            # Use WebP for all display resolutions (thumbnail, medium, large)
            filename = f"wallpaper_{timestamp}_{file_hash}_{resolution}.webp"
        
        return filename
    
    def resize_image(self, image: Image.Image, target_width: int, target_height: int) -> Image.Image:
        """
        Resize image while maintaining aspect ratio and quality
        
        Args:
            image: PIL Image object
            target_width: Target width
            target_height: Target height
            
        Returns:
            Resized PIL Image object
        """
        # Calculate current aspect ratio
        current_ratio = image.height / image.width
        target_ratio = target_height / target_width
        
        if current_ratio > target_ratio:
            # Image is taller - fit to width
            new_width = target_width
            new_height = int(target_width * current_ratio)
        else:
            # Image is wider - fit to height
            new_height = target_height
            new_width = int(target_height / current_ratio)
        
        # Resize with high-quality resampling
        resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Crop to exact target size if needed
        if new_width != target_width or new_height != target_height:
            # Calculate crop box to center the image
            left = (new_width - target_width) // 2
            top = (new_height - target_height) // 2
            right = left + target_width
            bottom = top + target_height
            
            resized = resized.crop((left, top, right, bottom))
        
        return resized
    
    def enhance_image(self, image: Image.Image, resolution: str) -> Image.Image:
        """
        Apply image enhancements based on resolution
        
        Args:
            image: PIL Image object
            resolution: Resolution type
            
        Returns:
            Enhanced PIL Image object
        """
        enhanced = image.copy()
        
        # Apply different enhancements based on resolution
        if resolution == 'thumbnail':
            # For thumbnails, increase sharpness and contrast slightly
            enhancer = ImageEnhance.Sharpness(enhanced)
            enhanced = enhancer.enhance(1.2)
            
            enhancer = ImageEnhance.Contrast(enhanced)
            enhanced = enhancer.enhance(1.1)
            
        elif resolution in ['medium', 'large']:
            # For medium/large, subtle sharpening
            enhancer = ImageEnhance.Sharpness(enhanced)
            enhanced = enhancer.enhance(1.1)
        
        return enhanced
    
    def inject_seo_metadata(self, image_path: str, wallpaper_metadata: Dict) -> bool:
        """
        Inject SEO metadata into image EXIF and IPTC data
        
        Args:
            image_path: Path to the image file
            wallpaper_metadata: Dictionary containing wallpaper information
            
        Returns:
            Boolean indicating success
        """
        try:
            # Prepare metadata for injection
            title = wallpaper_metadata.get('title', 'Mobile Wallpaper')
            description = wallpaper_metadata.get('description', 'High-quality mobile wallpaper')
            category = wallpaper_metadata.get('category', 'wallpaper')
            tags = wallpaper_metadata.get('tags', [])
            website_url = "https://wallpaperhub.com"
            
            # Keywords for Google ranking
            keywords = [
                f"{category} wallpaper",
                "mobile wallpaper", 
                "phone background",
                "HD wallpaper",
                "smartphone wallpaper"
            ]
            if tags:
                keywords.extend(tags[:5])  # Add first 5 tags
            
            # Create EXIF data
            exif_dict = {
                "0th": {
                    piexif.ImageIFD.ImageDescription: description.encode('utf-8'),
                    piexif.ImageIFD.Artist: "WallpaperHub".encode('utf-8'),
                    piexif.ImageIFD.Software: "WallpaperHub Publisher V3".encode('utf-8'),
                    piexif.ImageIFD.Copyright: f"© WallpaperHub - {website_url}".encode('utf-8'),
                    piexif.ImageIFD.XPTitle: title.encode('utf-16le'),
                    piexif.ImageIFD.XPComment: description.encode('utf-16le'),
                    piexif.ImageIFD.XPKeywords: ", ".join(keywords).encode('utf-16le'),
                    piexif.ImageIFD.XPSubject: f"{category} mobile wallpaper".encode('utf-16le'),
                },
                "Exif": {
                    piexif.ExifIFD.UserComment: f"{title} - {description}".encode('utf-8'),
                },
                "1st": {},
                "thumbnail": None
            }
            
            # Convert to bytes
            exif_bytes = piexif.dump(exif_dict)
            
            # Load image and inject EXIF
            with Image.open(image_path) as img:
                # Ensure RGB mode for JPEG
                if img.mode != 'RGB':
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                
                # Save with EXIF data
                img.save(image_path, 'JPEG', exif=exif_bytes, quality=95, optimize=True)
            
            # Also add IPTC metadata using iptcinfo3
            try:
                info = IPTCInfo(image_path, force=True)
                
                # Set IPTC fields for better SEO
                info['keywords'] = keywords[:15]  # IPTC supports up to 32 keywords, limit to 15
                info['caption/abstract'] = description
                info['headline'] = title
                info['object name'] = title
                info['category'] = category.upper()[:3]  # IPTC category is 3-char code
                info['supplemental category'] = [category, 'mobile', 'wallpaper']
                info['copyright notice'] = f"© WallpaperHub - {website_url}"
                info['credit'] = "WallpaperHub"
                info['source'] = website_url
                info['special instructions'] = f"Mobile wallpaper in {category} category - Free download"
                
                # Save IPTC data
                info.save()
                
            except Exception as iptc_error:
                print(f"Warning: Could not add IPTC metadata: {iptc_error}")
                # Continue even if IPTC fails, EXIF is more important
            
            return True
            
        except Exception as e:
            print(f"Error injecting SEO metadata: {e}")
            return False
    
    def process_single_resolution(self, image_path: str, resolution: str, wallpaper_metadata: Dict = None) -> Tuple[bool, str, Dict]:
        """
        Process image for a single resolution with SEO metadata injection
        
        Args:
            image_path: Path to the original image
            resolution: Resolution type to process
            wallpaper_metadata: Optional metadata for SEO injection
            
        Returns:
            Tuple of (success, output_path, metadata)
        """
        try:
            config = self.resolutions[resolution]
            
            # Generate output filename
            output_filename = self.generate_filename(image_path, resolution)
            output_path = self.output_dir / output_filename
            
            with Image.open(image_path) as img:
                # Convert to RGB if needed (removes transparency, handles RGBA)
                if img.mode != 'RGB':
                    # Create white background for transparency
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                    else:
                        background.paste(img)
                    img = background
                
                # Process based on resolution
                if resolution == 'original':
                    # Keep original size but optimize quality
                    processed = self.enhance_image(img, resolution)
                else:
                    # Resize to target resolution
                    processed = self.resize_image(img, config['width'], config['height'])
                    processed = self.enhance_image(processed, resolution)
                
                # Save with appropriate format and optimization
                if resolution == 'original':
                    # Save original in best compatible format
                    original_ext = Path(image_path).suffix.lower()
                    if original_ext in ['.heic', '.heif']:
                        # Convert HEIC/HEIF to JPG for compatibility
                        save_kwargs = {
                            'format': 'JPEG',
                            'quality': config['quality'],
                            'optimize': True,
                            'progressive': True
                        }
                    elif original_ext in ['.png']:
                        # Keep PNG format for originals if needed
                        save_kwargs = {
                            'format': 'PNG',
                            'optimize': True
                        }
                    else:
                        # Default to high-quality JPEG
                        save_kwargs = {
                            'format': 'JPEG',
                            'quality': config['quality'],
                            'optimize': True,
                            'progressive': True
                        }
                else:
                    # Use WebP for all display resolutions (thumbnail, medium, large)
                    # High-quality WebP settings for better visual quality
                    save_kwargs = {
                        'format': 'WebP',
                        'quality': config['quality'],
                        'method': 6,        # Best compression method (0-6, 6 is best quality)
                        'optimize': True,
                        'lossless': False,  # Use lossy but high quality
                        'exact': False      # Allow slight quality adjustments for better compression
                    }
                
                processed.save(output_path, **save_kwargs)
                
                # Inject SEO metadata if provided (only for JPEG/original files)
                if wallpaper_metadata and resolution == 'original':
                    # Only inject metadata into original files since WebP doesn't support EXIF/IPTC well
                    self.inject_seo_metadata(str(output_path), wallpaper_metadata)
                
                # Generate metadata
                metadata = {
                    'resolution': resolution,
                    'filename': output_filename,
                    'path': str(output_path),
                    'size': processed.size,
                    'width': processed.size[0],
                    'height': processed.size[1],
                    'file_size': os.path.getsize(output_path),
                    'quality': config['quality'],
                    'created_at': datetime.now().isoformat()
                }
                
                return True, str(output_path), metadata
                
        except Exception as e:
            return False, "", {'error': str(e)}
    
    def process_all_resolutions(self, image_path: str, wallpaper_metadata: Dict = None) -> Dict:
        """
        Process image for all resolutions with SEO metadata injection
        
        Args:
            image_path: Path to the original image
            wallpaper_metadata: Optional metadata for SEO injection
            
        Returns:
            Dictionary with results for all resolutions
        """
        # Validate image first
        is_valid, error_msg = self.validate_image(image_path)
        if not is_valid:
            return {'error': error_msg, 'success': False}
        
        # Get original image info
        original_info = self.get_image_info(image_path)
        
        results = {
            'success': True,
            'original_info': original_info,
            'processed_files': {},
            'urls': {},
            'metadata': {
                'processing_date': datetime.now().isoformat(),
                'original_path': image_path
            }
        }
        
        # Process each resolution
        for resolution in self.resolutions.keys():
            success, output_path, metadata = self.process_single_resolution(image_path, resolution, wallpaper_metadata)
            
            if success:
                results['processed_files'][resolution] = output_path
                results['metadata'][resolution] = metadata
                
                # Generate relative URL (assuming files will be served from /images/)
                filename = Path(output_path).name
                results['urls'][resolution] = f"/images/{filename}"
            else:
                results['success'] = False
                results.setdefault('errors', {})[resolution] = metadata.get('error', 'Unknown error')
        
        return results
    
    def batch_process(self, image_paths: List[str]) -> Dict:
        """
        Process multiple images in batch
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            Dictionary with batch processing results
        """
        results = {
            'total_images': len(image_paths),
            'successful': 0,
            'failed': 0,
            'results': {},
            'errors': {}
        }
        
        for i, image_path in enumerate(image_paths):
            print(f"Processing {i+1}/{len(image_paths)}: {Path(image_path).name}")
            
            try:
                result = self.process_all_resolutions(image_path)
                
                if result['success']:
                    results['successful'] += 1
                    results['results'][image_path] = result
                else:
                    results['failed'] += 1
                    results['errors'][image_path] = result.get('error', 'Unknown error')
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'][image_path] = str(e)
        
        return results
    
    def generate_html_preview(self, processing_result: Dict, output_file: str = None) -> str:
        """
        Generate HTML preview of processed images
        
        Args:
            processing_result: Result from process_all_resolutions
            output_file: Optional output file path
            
        Returns:
            HTML content as string
        """
        html_content = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Image Processing Preview</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                .resolution-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .resolution-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .resolution-item img { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .info { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; text-align: left; }
                .info h4 { margin: 0 0 10px 0; color: #333; }
                .info p { margin: 5px 0; font-size: 14px; color: #666; }
                .original-info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Image Processing Results</h1>
        """
        
        if not processing_result['success']:
            html_content += f"<div class='error' style='color: red; padding: 20px; background: #ffebee;'>"
            html_content += f"<h2>Processing Failed</h2>"
            html_content += f"<p>{processing_result.get('error', 'Unknown error')}</p></div>"
        else:
            # Original image info
            original_info = processing_result['original_info']
            html_content += f"""
                <div class="original-info">
                    <h3>Original Image Information</h3>
                    <p><strong>Filename:</strong> {original_info['filename']}</p>
                    <p><strong>Size:</strong> {original_info['width']} × {original_info['height']} pixels</p>
                    <p><strong>Aspect Ratio:</strong> {original_info['aspect_ratio']:.2f}</p>
                    <p><strong>File Size:</strong> {original_info['file_size'] / 1024:.1f} KB</p>
                    <p><strong>Format:</strong> {original_info['format']}</p>
                </div>
                
                <h2>Processed Resolutions</h2>
                <div class="resolution-grid">
            """
            
            # Add each resolution
            for resolution in ['thumbnail', 'medium', 'large', 'original']:
                if resolution in processing_result['processed_files']:
                    file_path = processing_result['processed_files'][resolution]
                    metadata = processing_result['metadata'][resolution]
                    url = processing_result['urls'][resolution]
                    
                    html_content += f"""
                        <div class="resolution-item">
                            <h3>{resolution.title()}</h3>
                            <img src="{url}" alt="{resolution} resolution">
                            <div class="info">
                                <h4>Details</h4>
                                <p><strong>Size:</strong> {metadata['width']} × {metadata['height']}</p>
                                <p><strong>File Size:</strong> {metadata['file_size'] / 1024:.1f} KB</p>
                                <p><strong>Quality:</strong> {metadata['quality']}%</p>
                                <p><strong>Filename:</strong> {metadata['filename']}</p>
                            </div>
                        </div>
                    """
            
            html_content += "</div>"
        
        html_content += """
            </div>
        </body>
        </html>
        """
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
        
        return html_content
    
    def clean_output_directory(self, keep_recent: int = 50):
        """
        Clean old processed images, keeping only the most recent ones
        
        Args:
            keep_recent: Number of recent files to keep
        """
        try:
            # Get all image files (WebP and other formats)
            files = []
            for pattern in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
                files.extend(self.output_dir.glob(pattern))
            
            files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            for file_path in files[keep_recent:]:
                file_path.unlink()
                print(f"Deleted old file: {file_path.name}")
                
        except Exception as e:
            print(f"Error cleaning directory: {e}")


def main():
    """CLI interface for the image processor"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Process wallpaper images')
    parser.add_argument('images', nargs='+', help='Image files to process')
    parser.add_argument('--output-dir', default='processed_images', help='Output directory')
    parser.add_argument('--preview', action='store_true', help='Generate HTML preview')
    parser.add_argument('--clean', type=int, metavar='N', help='Keep only N recent files')
    
    args = parser.parse_args()
    
    processor = ImageProcessor(args.output_dir)
    
    if args.clean:
        processor.clean_output_directory(args.clean)
        return
    
    if len(args.images) == 1:
        # Single image processing
        result = processor.process_all_resolutions(args.images[0])
        
        if result['success']:
            print("✅ Processing successful!")
            print(f"📁 Output directory: {processor.output_dir}")
            
            for resolution, file_path in result['processed_files'].items():
                metadata = result['metadata'][resolution]
                print(f"  {resolution}: {Path(file_path).name} ({metadata['file_size'] / 1024:.1f} KB)")
            
            if args.preview:
                preview_file = processor.output_dir / "preview.html"
                processor.generate_html_preview(result, preview_file)
                print(f"🌐 Preview generated: {preview_file}")
        else:
            print(f"❌ Processing failed: {result['error']}")
    else:
        # Batch processing
        results = processor.batch_process(args.images)
        
        print(f"📊 Batch processing complete:")
        print(f"  Total: {results['total_images']}")
        print(f"  Successful: {results['successful']}")
        print(f"  Failed: {results['failed']}")
        
        if results['errors']:
            print("\n❌ Errors:")
            for image_path, error in results['errors'].items():
                print(f"  {Path(image_path).name}: {error}")


if __name__ == "__main__":
    main()