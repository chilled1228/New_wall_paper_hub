#!/usr/bin/env python3
"""
Wallpaper Publisher V3 - Updated for Current Website Structure
A Tkinter application for uploading and managing wallpapers with automatic image processing
Integrates with Supabase database and Cloudflare R2 storage
Generates multiple resolutions: thumbnail, medium, large, and original
Uses Google Gemini AI for automatic metadata generation
Updated to match current database schema and website features
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import os
import sys
from pathlib import Path
import threading
from typing import Optional, Dict, List
import json
from datetime import datetime
import uuid
import re

# Import our custom image processor
from image_processor import ImageProcessor

# Third-party imports
try:
    from dotenv import load_dotenv
    from supabase import create_client, Client
    import boto3
    from botocore.exceptions import ClientError
    from PIL import Image, ImageTk
    import google.generativeai as genai
    import requests
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install requirements: pip install -r requirements.txt")
    sys.exit(1)

class WallpaperPublisherV3:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Wallpaper Publisher V3 - Updated for Current Website")
        self.root.geometry("1000x900")
        self.root.resizable(True, True)
        
        # Load environment variables
        self.load_environment()
        
        # Initialize clients
        self.supabase_client = None
        self.r2_client = None
        self.gemini_model = None
        
        # Initialize image processor
        self.image_processor = ImageProcessor("temp_processed")
        
        # Application state
        self.selected_image_path = None
        self.preview_image = None
        self.generated_metadata = {}
        self.processed_images = {}  # Store processed image results
        
        # Current website categories (matching the live site)
        self.website_categories = [
            "nature", "abstract", "minimal", "minimalist", "urban", "space", "art", 
            "anime", "gaming", "dark", "light", "gradient", "pattern", "landscape",
            "portrait", "animals", "flowers", "ocean", "mountains", "sky", "sunset",
            "architecture", "technology", "vintage", "modern", "cute", "aesthetic",
            "colorful", "monochrome", "geometric"
        ]
        
        # Setup UI
        self.setup_ui()
        
        # Initialize services
        self.initialize_services()
        
        # Check initial ready state
        self.check_ready_state()
    
    def load_environment(self):
        """Load environment variables from .env.local file"""
        env_path = Path(".env.local")
        if env_path.exists():
            load_dotenv(env_path)
        else:
            messagebox.showerror("Error", ".env.local file not found!")
            sys.exit(1)
        
        # Validate required environment variables
        required_vars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'R2_ACCOUNT_ID',
            'R2_ACCESS_KEY_ID',
            'R2_SECRET_ACCESS_KEY',
            'R2_BUCKET_NAME'
        ]

        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            messagebox.showerror("Error", f"Missing environment variables: {', '.join(missing_vars)}")
            sys.exit(1)

        # Check if Gemini API key is available in environment
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', '').strip('"')
    
    def setup_ui(self):
        """Setup the enhanced user interface"""
        # Create main frame with scrollbar
        canvas = tk.Canvas(self.root)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        main_frame = scrollable_frame
        main_frame = ttk.Frame(main_frame)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)
        
        # Title
        title_label = ttk.Label(main_frame, text="Wallpaper Publisher V3", font=("Arial", 18, "bold"))
        title_label.pack(pady=(0, 5))
        
        subtitle_label = ttk.Label(main_frame, text="Updated for Current Website Structure with Enhanced SEO & Analytics", font=("Arial", 10))
        subtitle_label.pack(pady=(0, 15))
        
        # Info labels with updated features
        info_frame = ttk.Frame(main_frame)
        info_frame.pack(fill=tk.X, pady=(0, 20))
        
        ttk.Label(info_frame, text="🔗 SEO-friendly URLs with optimized slugs", font=("Arial", 9), foreground="blue").pack(anchor=tk.W)
        ttk.Label(info_frame, text="📱 4 resolutions: thumbnail (WebP) → medium (WebP) → large (WebP) → original (for download)", font=("Arial", 9), foreground="green").pack(anchor=tk.W)
        ttk.Label(info_frame, text="⚡ WebP format for web display (smaller files, faster loading) + original format for downloads", font=("Arial", 9), foreground="orange").pack(anchor=tk.W)
        ttk.Label(info_frame, text="📊 Auto-creates analytics entries for tracking downloads, likes, and views", font=("Arial", 9), foreground="purple").pack(anchor=tk.W)
        ttk.Label(info_frame, text="🎯 Enhanced metadata with SEO optimization and structured data support", font=("Arial", 9), foreground="darkgreen").pack(anchor=tk.W)
        
        # Image selection frame
        image_frame = ttk.LabelFrame(main_frame, text="Image Selection & Processing", padding=15)
        image_frame.pack(fill=tk.X, pady=(0, 15))
        
        selection_frame = ttk.Frame(image_frame)
        selection_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(selection_frame, text="Select Wallpaper Image", command=self.select_image).pack(side=tk.LEFT)
        self.image_path_label = ttk.Label(selection_frame, text="No image selected", foreground="gray")
        self.image_path_label.pack(side=tk.LEFT, padx=(15, 0))
        
        # Process button
        process_frame = ttk.Frame(image_frame)
        process_frame.pack(fill=tk.X, pady=(5, 0))
        
        self.process_btn = ttk.Button(process_frame, text="Process Image (Generate All Resolutions)", 
                                    command=self.process_image, state=tk.DISABLED)
        self.process_btn.pack(side=tk.LEFT)
        
        self.processing_status = ttk.Label(process_frame, text="", foreground="gray")
        self.processing_status.pack(side=tk.LEFT, padx=(15, 0))
        
        # Image preview frame with resolution tabs
        self.preview_frame = ttk.LabelFrame(main_frame, text="Image Preview", padding=15)
        self.preview_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Create notebook for different resolution previews
        self.preview_notebook = ttk.Notebook(self.preview_frame)
        self.preview_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Create tabs for each resolution (thumbnail, medium, large, original)
        self.preview_tabs = {}
        for resolution in ['original', 'large', 'medium', 'thumbnail']:
            tab_frame = ttk.Frame(self.preview_notebook)
            self.preview_notebook.add(tab_frame, text=resolution.title())
            
            preview_label = ttk.Label(tab_frame, text=f"No {resolution} preview available")
            preview_label.pack(expand=True)
            
            self.preview_tabs[resolution] = {
                'frame': tab_frame,
                'label': preview_label,
                'info_label': ttk.Label(tab_frame, text="", font=("Arial", 8), foreground="gray")
            }
            self.preview_tabs[resolution]['info_label'].pack()
        
        # AI Generation frame
        ai_frame = ttk.LabelFrame(main_frame, text="AI Metadata Generation", padding=15)
        ai_frame.pack(fill=tk.X, pady=(0, 15))
        
        ai_button_frame = ttk.Frame(ai_frame)
        ai_button_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.generate_btn = ttk.Button(ai_button_frame, text="Generate Metadata with AI", 
                                     command=self.generate_metadata, state=tk.DISABLED)
        self.generate_btn.pack(side=tk.LEFT)
        
        # Gemini API key entry
        ttk.Label(ai_button_frame, text="Gemini API Key:").pack(side=tk.LEFT, padx=(25, 5))
        self.gemini_key_entry = ttk.Entry(ai_button_frame, width=35, show="*")
        self.gemini_key_entry.pack(side=tk.LEFT, padx=(0, 10))
        self.gemini_key_entry.bind('<KeyRelease>', self.on_api_key_change)

        # Pre-populate Gemini API key if available in environment
        if hasattr(self, 'gemini_api_key') and self.gemini_api_key:
            self.gemini_key_entry.insert(0, self.gemini_api_key)
        
        # Metadata editing frame
        metadata_frame = ttk.LabelFrame(main_frame, text="Wallpaper Metadata", padding=15)
        metadata_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        # Create two columns for metadata fields
        left_column = ttk.Frame(metadata_frame)
        left_column.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 15))
        
        right_column = ttk.Frame(metadata_frame)
        right_column.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Title field
        ttk.Label(left_column, text="Title:").pack(anchor=tk.W)
        self.title_entry = ttk.Entry(left_column, width=40, font=("Arial", 10))
        self.title_entry.pack(fill=tk.X, pady=(0, 8))
        self.title_entry.bind('<KeyRelease>', self.update_slug_preview)
        
        # Slug preview label
        self.slug_preview_label = ttk.Label(left_column, text="Slug preview will appear here", 
                                          font=("Arial", 9), foreground="gray")
        self.slug_preview_label.pack(anchor=tk.W, pady=(0, 15))
        
        # Category field with updated categories
        ttk.Label(left_column, text="Category:").pack(anchor=tk.W)
        self.category_var = tk.StringVar()
        self.category_combo = ttk.Combobox(left_column, textvariable=self.category_var, 
                                         values=self.website_categories,
                                         font=("Arial", 10))
        self.category_combo.pack(fill=tk.X, pady=(0, 15))
        self.category_combo.bind('<<ComboboxSelected>>', self.update_slug_preview)
        
        # Tags field
        ttk.Label(right_column, text="Tags (comma-separated):").pack(anchor=tk.W)
        self.tags_entry = ttk.Entry(right_column, width=40, font=("Arial", 10))
        self.tags_entry.pack(fill=tk.X, pady=(0, 15))
        
        # Description field
        ttk.Label(right_column, text="Description:").pack(anchor=tk.W)
        self.description_text = scrolledtext.ScrolledText(right_column, height=5, width=40, font=("Arial", 10))
        self.description_text.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        # SEO Enhancement frame
        seo_frame = ttk.LabelFrame(main_frame, text="SEO & Analytics Settings", padding=10)
        seo_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Initial stats settings
        stats_frame = ttk.Frame(seo_frame)
        stats_frame.pack(fill=tk.X)
        
        ttk.Label(stats_frame, text="Initial Stats (optional):").pack(anchor=tk.W, pady=(0, 5))
        
        stats_input_frame = ttk.Frame(stats_frame)
        stats_input_frame.pack(fill=tk.X)
        
        ttk.Label(stats_input_frame, text="Views:").pack(side=tk.LEFT)
        self.initial_views = ttk.Entry(stats_input_frame, width=8)
        self.initial_views.pack(side=tk.LEFT, padx=(5, 15))
        self.initial_views.insert(0, "0")
        
        ttk.Label(stats_input_frame, text="Likes:").pack(side=tk.LEFT)
        self.initial_likes = ttk.Entry(stats_input_frame, width=8)
        self.initial_likes.pack(side=tk.LEFT, padx=(5, 15))
        self.initial_likes.insert(0, "0")
        
        ttk.Label(stats_input_frame, text="Downloads:").pack(side=tk.LEFT)
        self.initial_downloads = ttk.Entry(stats_input_frame, width=8)
        self.initial_downloads.pack(side=tk.LEFT, padx=(5, 0))
        self.initial_downloads.insert(0, "0")
        
        # Progress and status frame
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.progress_bar = ttk.Progressbar(status_frame, mode='indeterminate')
        self.progress_bar.pack(fill=tk.X, pady=(0, 8))
        
        self.status_label = ttk.Label(status_frame, text="Ready", foreground="green", font=("Arial", 10))
        self.status_label.pack()
        
        # Action buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X)
        
        self.publish_btn = ttk.Button(button_frame, text="🚀 Publish Wallpaper", 
                                    command=self.publish_wallpaper, state=tk.DISABLED)
        self.publish_btn.pack(side=tk.RIGHT, padx=(15, 0))
        
        ttk.Button(button_frame, text="🧹 Clear All", command=self.clear_all).pack(side=tk.RIGHT)
        ttk.Button(button_frame, text="👁️ Preview HTML", command=self.generate_preview).pack(side=tk.RIGHT, padx=(0, 15))
    
    def initialize_services(self):
        """Initialize Supabase and R2 clients"""
        try:
            # Initialize Supabase client
            supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
            self.supabase_client = create_client(supabase_url, supabase_key)
            
            # Initialize R2 client
            self.r2_client = boto3.client(
                's3',
                endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
                aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
                region_name='auto'
            )
            
            self.update_status("Services initialized successfully", "green")
            
        except Exception as e:
            self.update_status(f"Failed to initialize services: {str(e)}", "red")
            messagebox.showerror("Initialization Error", f"Failed to initialize services: {str(e)}")
    
    def on_api_key_change(self, event=None):
        """Handle API key entry changes"""
        self.check_ready_state()
    
    def select_image(self):
        """Open file dialog to select an image"""
        file_types = [
            ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff *.heic *.heif *.webp"),
            ("JPEG files", "*.jpg *.jpeg"),
            ("PNG files", "*.png"),
            ("HEIC files", "*.heic *.heif"),
            ("All files", "*.*")
        ]
        
        file_path = filedialog.askopenfilename(
            title="Select Wallpaper Image",
            filetypes=file_types
        )
        
        if file_path:
            # Validate image first
            is_valid, error_msg = self.image_processor.validate_image(file_path)
            if not is_valid:
                messagebox.showerror("Invalid Image", f"Selected image is not valid:\n{error_msg}")
                return
            
            self.selected_image_path = file_path
            self.image_path_label.config(text=os.path.basename(file_path), foreground="black")
            self.processed_images = {}  # Reset processed images
            
            # Show original image info
            image_info = self.image_processor.get_image_info(file_path)
            info_text = f"📐 {image_info['width']}×{image_info['height']}px | 📁 {image_info['file_size']/1024:.1f}KB | 🎨 {image_info['format']}"
            self.processing_status.config(text=info_text, foreground="blue")
            
            # Show basic preview in first tab
            self.show_basic_preview()
            self.check_ready_state()
    
    def show_basic_preview(self):
        """Display basic image preview before processing"""
        if not self.selected_image_path:
            return
        
        try:
            # Show preview in original tab
            image = Image.open(self.selected_image_path)
            
            # Calculate preview size (max 400x300)
            max_width, max_height = 400, 300
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Convert to PhotoImage
            preview_photo = ImageTk.PhotoImage(image)
            
            # Update original tab
            original_tab = self.preview_tabs['original']
            original_tab['label'].config(image=preview_photo, text="")
            original_tab['label'].image = preview_photo  # Keep reference
            original_tab['info_label'].config(text="Original image (not yet processed)")
            
            # Clear other tabs
            for resolution in ['large', 'medium', 'thumbnail']:
                tab = self.preview_tabs[resolution]
                tab['label'].config(image="", text=f"Click 'Process Image' to generate {resolution} version")
                tab['info_label'].config(text="")
            
        except Exception as e:
            self.processing_status.config(text=f"Preview error: {str(e)}", foreground="red")
    
    def process_image(self):
        """Process the selected image to generate all resolutions"""
        if not self.selected_image_path:
            messagebox.showerror("Error", "Please select an image first")
            return
        
        # Run processing in a separate thread
        threading.Thread(target=self._process_image_thread, daemon=True).start()
    
    def _process_image_thread(self):
        """Process image in a separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status("Processing image - generating all resolutions...", "blue"))
            self.root.after(0, lambda: self.processing_status.config(text="🔄 Processing...", foreground="blue"))
            
            # Prepare metadata for SEO injection
            wallpaper_metadata = {
                'title': self.title,
                'description': self.description,
                'category': self.category,
                'tags': self.tags
            }
            
            # Process all resolutions including the new large size with SEO metadata
            results = self.image_processor.process_all_resolutions(self.selected_image_path, wallpaper_metadata)
            
            if results['success']:
                self.processed_images = results
                self.root.after(0, lambda: self._update_preview_tabs(results))
                self.root.after(0, lambda: self.update_status("✅ Image processing completed successfully!", "green"))
                self.root.after(0, lambda: self.processing_status.config(text="✅ All resolutions generated", foreground="green"))
            else:
                error_msg = results.get('error', 'Unknown error')
                self.root.after(0, lambda: self.update_status(f"❌ Processing failed: {error_msg}", "red"))
                self.root.after(0, lambda: self.processing_status.config(text=f"❌ Failed: {error_msg}", foreground="red"))
                
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"Processing error: {str(e)}", "red"))
            self.root.after(0, lambda: self.processing_status.config(text=f"❌ Error: {str(e)}", foreground="red"))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
            self.root.after(0, lambda: self.check_ready_state())
    
    def _update_preview_tabs(self, results):
        """Update preview tabs with processed images"""
        try:
            for resolution in ['thumbnail', 'medium', 'large', 'original']:
                if resolution in results['processed_files']:
                    file_path = results['processed_files'][resolution]
                    metadata = results['metadata'][resolution]
                    
                    # Load and display image
                    image = Image.open(file_path)
                    
                    # Scale for preview (max 400x400)
                    max_size = 400
                    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    
                    preview_photo = ImageTk.PhotoImage(image)
                    
                    # Update tab
                    tab = self.preview_tabs[resolution]
                    tab['label'].config(image=preview_photo, text="")
                    tab['label'].image = preview_photo  # Keep reference
                    
                    # Update info
                    info_text = f"📐 {metadata['width']}×{metadata['height']}px | 📁 {metadata['file_size']/1024:.1f}KB | 🎯 Quality: {metadata['quality']}%"
                    tab['info_label'].config(text=info_text, foreground="green")
                
        except Exception as e:
            self.update_status(f"Preview update error: {str(e)}", "red")
    
    def generate_preview(self):
        """Generate HTML preview of processed images"""
        if not self.processed_images:
            messagebox.showwarning("No Processed Images", "Please process an image first")
            return
        
        try:
            preview_file = Path("image_preview.html")
            self.image_processor.generate_html_preview(self.processed_images, preview_file)
            
            # Try to open in default browser
            import webbrowser
            webbrowser.open(f"file://{preview_file.absolute()}")
            
            messagebox.showinfo("Preview Generated", f"HTML preview saved as: {preview_file}")
            
        except Exception as e:
            messagebox.showerror("Preview Error", f"Failed to generate preview: {str(e)}")
    
    def update_slug_preview(self, event=None):
        """Update the slug preview as user types"""
        title = self.title_entry.get().strip()
        category = self.category_var.get().strip()
        
        if title and category:
            # Clean title for slug preview (matching website's slug generation)
            clean_title = re.sub(r'[^a-z0-9\s-]', '', title.lower())
            clean_title = re.sub(r'\s+', '-', clean_title)
            clean_title = re.sub(r'-+', '-', clean_title).strip('-')[:50]
            
            # Clean category
            clean_category = re.sub(r'[^a-z0-9]', '', category.lower())
            
            # Generate preview slug
            slug_preview = f"{clean_category}-{clean_title}-[id]"
            self.slug_preview_label.config(text=f"🔗 /wallpaper/{slug_preview}", foreground="blue")
        else:
            self.slug_preview_label.config(text="Slug preview will appear here", foreground="gray")
    
    def check_ready_state(self):
        """Check if all requirements are met for various operations"""
        # Check if image is selected
        if self.selected_image_path:
            self.process_btn.config(state=tk.NORMAL)
        else:
            self.process_btn.config(state=tk.DISABLED)
        
        # Check if AI generation is ready
        api_key = self.gemini_key_entry.get().strip()
        if api_key and self.selected_image_path:
            self.generate_btn.config(state=tk.NORMAL)
        else:
            self.generate_btn.config(state=tk.DISABLED)
        
        # Check if ready to publish
        if (self.processed_images and 
            self.title_entry.get().strip() and 
            self.category_var.get().strip()):
            self.publish_btn.config(state=tk.NORMAL)
        else:
            self.publish_btn.config(state=tk.DISABLED)
        
        # Update slug preview
        self.update_slug_preview()
    
    def update_status(self, message: str, color: str = "black"):
        """Update status label"""
        self.status_label.config(text=message, foreground=color)
        self.root.update_idletasks()
    
    def generate_metadata(self):
        """Generate metadata using Google Gemini AI"""
        if not self.selected_image_path:
            messagebox.showerror("Error", "Please select an image first")
            return
        
        api_key = self.gemini_key_entry.get().strip()
        if not api_key:
            messagebox.showerror("Error", "Please enter your Gemini API key")
            return
        
        # Run AI generation in a separate thread
        threading.Thread(target=self._generate_metadata_thread, args=(api_key,), daemon=True).start()
    
    def _generate_metadata_thread(self, api_key: str):
        """Generate metadata in a separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status("Generating metadata with AI...", "blue"))
            
            # Configure Gemini with latest model
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Prepare the image
            image = Image.open(self.selected_image_path)
            
            # Create enhanced prompt for metadata generation with current website context
            category_list = ", ".join(self.website_categories)
            
            prompt = f"""
            Analyze this wallpaper image and generate comprehensive metadata for a mobile wallpaper website. 
            This is for WallpaperHub, a premium mobile wallpaper platform with SEO optimization.
            
            Provide your response in JSON format with the following fields:
            
            {{
                "title": "SEO-optimized title (max 60 characters)",
                "description": "Detailed SEO description (max 160 characters)", 
                "category": "one of: {category_list}",
                "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
            }}
            
            Guidelines:
            - Title should be catchy, descriptive, and SEO-friendly for mobile wallpaper searches
            - Description should include relevant keywords and describe the image appeal for mobile users
            - Choose the most appropriate category from the provided list based on the dominant theme
            - Provide 3-5 relevant tags that describe colors, style, objects, mood, aesthetic qualities
            - Consider this is specifically for mobile wallpapers so mention mobile/phone suitability
            - Use keywords that mobile wallpaper users would search for
            - Make titles and descriptions appealing for download conversion
            """
            
            # Generate content
            response = model.generate_content([prompt, image])
            
            # Parse JSON response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3]
            elif response_text.startswith('```'):
                response_text = response_text[3:-3]
            
            metadata = json.loads(response_text)
            
            # Update UI in main thread
            self.root.after(0, lambda: self._update_metadata_ui(metadata))
            
        except Exception as e:
            self.root.after(0, lambda: self._handle_ai_error(str(e)))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def _update_metadata_ui(self, metadata: Dict):
        """Update UI with generated metadata"""
        try:
            self.title_entry.delete(0, tk.END)
            self.title_entry.insert(0, metadata.get('title', ''))
            
            self.category_var.set(metadata.get('category', ''))
            
            tags = metadata.get('tags', [])
            self.tags_entry.delete(0, tk.END)
            self.tags_entry.insert(0, ', '.join(tags))
            
            self.description_text.delete(1.0, tk.END)
            self.description_text.insert(1.0, metadata.get('description', ''))
            
            self.generated_metadata = metadata
            self.update_status("✅ Metadata generated successfully!", "green")
            self.check_ready_state()
            
        except Exception as e:
            self.update_status(f"Error updating metadata: {str(e)}", "red")
    
    def _handle_ai_error(self, error_message: str):
        """Handle AI generation errors"""
        self.update_status(f"AI generation failed: {error_message}", "red")
        messagebox.showerror("AI Error", f"Failed to generate metadata: {error_message}")
    
    def publish_wallpaper(self):
        """Publish wallpaper with all resolutions to R2 and Supabase"""
        if not self.validate_form():
            return
        
        if not self.processed_images:
            messagebox.showerror("Error", "Please process the image first to generate all resolutions")
            return
        
        # Run publishing in a separate thread
        threading.Thread(target=self._publish_wallpaper_thread, daemon=True).start()
    
    def validate_form(self) -> bool:
        """Validate form data before publishing"""
        if not self.selected_image_path:
            messagebox.showerror("Error", "Please select an image")
            return False
        
        if not self.title_entry.get().strip():
            messagebox.showerror("Error", "Please enter a title")
            return False
        
        if not self.category_var.get().strip():
            messagebox.showerror("Error", "Please select a category")
            return False
        
        return True
    
    def _publish_wallpaper_thread(self):
        """Publish wallpaper with all resolutions in a separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status("Uploading all resolutions to R2...", "blue"))
            
            bucket_name = os.getenv('R2_BUCKET_NAME')
            uploaded_urls = {}
            
            # Upload all resolutions (thumbnail, medium, large, original)
            for resolution in ['thumbnail', 'medium', 'large', 'original']:
                if resolution in self.processed_images['processed_files']:
                    file_path = self.processed_images['processed_files'][resolution]
                    self.root.after(0, lambda r=resolution: self.update_status(f"Uploading {r} resolution...", "blue"))
                    
                    # Generate unique filename for this resolution
                    filename = Path(file_path).name
                    
                    # Upload to R2 with correct content type
                    file_extension = Path(filename).suffix.lower()
                    if file_extension == '.webp':
                        content_type = 'image/webp'
                    elif file_extension == '.png':
                        content_type = 'image/png'
                    else:
                        content_type = 'image/jpeg'
                    
                    with open(file_path, 'rb') as file:
                        self.r2_client.upload_fileobj(
                            file,
                            bucket_name,
                            filename,
                            ExtraArgs={'ContentType': content_type}
                        )
                    
                    # Construct public URL
                    public_url = f"{os.getenv('R2_PUBLIC_URL')}/{filename}"
                    uploaded_urls[f"{resolution}_url"] = public_url
            
            self.root.after(0, lambda: self.update_status("Saving to database...", "blue"))
            
            # Prepare data for Supabase (matching current schema)
            tags = [tag.strip() for tag in self.tags_entry.get().split(',') if tag.strip()]
            
            wallpaper_data = {
                'title': self.title_entry.get().strip(),
                'description': self.description_text.get(1.0, tk.END).strip(),
                'category': self.category_var.get().strip(),
                'tags': tags,
                'image_url': uploaded_urls['medium_url'],  # Main image URL for preview
                'thumbnail_url': uploaded_urls.get('thumbnail_url'),
                'medium_url': uploaded_urls.get('medium_url'),
                'large_url': uploaded_urls.get('large_url'),  # New field in current schema
                'original_url': uploaded_urls.get('original_url')
            }
            
            # Insert into Supabase
            result = self.supabase_client.table('wallpapers').insert(wallpaper_data).execute()
            
            if result.data:
                # Get the inserted record with its ID
                inserted_record = result.data[0]
                wallpaper_id = inserted_record.get('id')
                
                # Create initial wallpaper stats entry
                self.root.after(0, lambda: self.update_status("Creating analytics entry...", "blue"))
                
                stats_data = {
                    'wallpaper_id': wallpaper_id,
                    'views': int(self.initial_views.get() or 0),
                    'likes': int(self.initial_likes.get() or 0),
                    'downloads': int(self.initial_downloads.get() or 0)
                }
                
                # Insert stats
                stats_result = self.supabase_client.table('wallpaper_stats').insert(stats_data).execute()
                
                self.root.after(0, lambda: self._publish_success_with_urls(uploaded_urls, wallpaper_id, wallpaper_data))
            else:
                raise Exception("Failed to insert into database")
                
        except Exception as e:
            self.root.after(0, lambda: self._publish_error(str(e)))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def _publish_success_with_urls(self, uploaded_urls: Dict, wallpaper_id: str, wallpaper_data: Dict):
        """Handle successful publishing with all URLs"""
        self.update_status("🎉 Wallpaper published successfully with all resolutions!", "green")
        
        # Generate the actual slug using the same logic as the frontend
        title = wallpaper_data['title']
        category = wallpaper_data['category']
        
        # Clean title for slug (matching frontend slug generation)
        clean_title = re.sub(r'[^a-z0-9\s-]', '', title.lower())
        clean_title = re.sub(r'\s+', '-', clean_title)
        clean_title = re.sub(r'-+', '-', clean_title).strip('-')[:50]
        
        # Clean category
        clean_category = re.sub(r'[^a-z0-9]', '', category.lower())
        
        # Use last 8 characters of ID as short ID
        short_id = wallpaper_id[-8:] if len(wallpaper_id) >= 8 else wallpaper_id
        
        # Generate the actual slug
        slug = f"{clean_category}-{clean_title}-{short_id}"
        
        # Get file sizes for the success message
        size_info = []
        for resolution in ['thumbnail', 'medium', 'large', 'original']:
            if resolution in self.processed_images['metadata']:
                metadata = self.processed_images['metadata'][resolution]
                size_kb = metadata['file_size'] / 1024
                size_info.append(f"  {resolution}: {metadata['width']}×{metadata['height']} ({size_kb:.1f}KB)")
        
        success_message = f"""🎉 Wallpaper published successfully to WallpaperHub!

📷 All Resolutions Uploaded:
{chr(10).join(size_info)}

🔗 Wallpaper URL: /wallpaper/{slug}
🆔 Wallpaper ID: {wallpaper_id}
📊 Analytics tracking: ENABLED

🚀 Your wallpaper is now live with optimized WebP loading:
• Thumbnail WebP for grid views (150x200) - ultra-fast loading
• Medium WebP for preview pages (400x533) - optimized display
• Large WebP for detailed viewing (720x960) - high quality web
• Original format for downloads (full quality) - best user experience

💡 Features enabled:
✅ WebP format for 60-80% smaller file sizes
✅ Original format preserved for downloads
✅ SEO-optimized URL structure
✅ Mobile-responsive image loading
✅ Analytics tracking (views, likes, downloads)
✅ Structured data for search engines
✅ Social media sharing optimization

📈 Your wallpaper appears in '{category}' category!"""
        
        messagebox.showinfo("Success! 🎉", success_message)
        
        # Clean up temporary files
        try:
            for file_path in self.processed_images['processed_files'].values():
                Path(file_path).unlink()
        except:
            pass
        
        self.clear_all()
    
    def _publish_error(self, error_message: str):
        """Handle publishing errors"""
        self.update_status(f"❌ Publishing failed: {error_message}", "red")
        messagebox.showerror("Publishing Error", f"Failed to publish wallpaper: {error_message}")
    
    def clear_all(self):
        """Clear all form fields and reset state"""
        self.selected_image_path = None
        self.preview_image = None
        self.generated_metadata = {}
        self.processed_images = {}
        
        self.image_path_label.config(text="No image selected", foreground="gray")
        self.processing_status.config(text="", foreground="gray")
        
        # Clear preview tabs
        for resolution, tab in self.preview_tabs.items():
            tab['label'].config(image="", text=f"No {resolution} preview available")
            tab['info_label'].config(text="")
        
        self.title_entry.delete(0, tk.END)
        self.category_var.set("")
        self.tags_entry.delete(0, tk.END)
        self.description_text.delete(1.0, tk.END)
        
        # Reset initial stats
        self.initial_views.delete(0, tk.END)
        self.initial_views.insert(0, "0")
        self.initial_likes.delete(0, tk.END)
        self.initial_likes.insert(0, "0")
        self.initial_downloads.delete(0, tk.END)
        self.initial_downloads.insert(0, "0")
        
        # Reset slug preview
        self.slug_preview_label.config(text="Slug preview will appear here", foreground="gray")
        
        self.update_status("Ready", "green")
        self.check_ready_state()
    
    def run(self):
        """Start the application"""
        self.root.mainloop()


if __name__ == "__main__":
    app = WallpaperPublisherV3()
    app.run()