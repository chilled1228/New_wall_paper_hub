#!/usr/bin/env python3
"""
Batch Wallpaper Publisher
A GUI application that imports wallpaper_publisher_v3 as a module and processes entire folders
Allows one-click batch processing of multiple wallpapers with AI metadata generation
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import os
import sys
import threading
import time
from pathlib import Path
from typing import List, Dict, Optional
import json
from datetime import datetime
import uuid

# Import our modules
try:
    from wallpaper_publisher_v3 import WallpaperPublisherV3
    from image_processor import ImageProcessor
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

# Third-party imports
try:
    from dotenv import load_dotenv
    from supabase import create_client, Client
    import boto3
    from PIL import Image
    import google.generativeai as genai
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install requirements: pip install -r requirements.txt")
    sys.exit(1)

class BatchWallpaperPublisher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Batch Wallpaper Publisher - Process Entire Folders")
        self.root.geometry("1200x800")
        self.root.resizable(True, True)
        
        # Load environment variables
        self.load_environment()
        
        # Initialize services (reuse from wallpaper_publisher_v3)
        self.supabase_client = None
        self.r2_client = None
        self.image_processor = ImageProcessor("temp_batch_processed")
        
        # Batch processing state
        self.selected_folder = None
        self.image_files = []
        self.processing_results = []
        self.current_processing_index = 0
        self.is_processing = False
        self.stop_processing = False
        
        # Categories from original publisher
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

        # Check if Gemini API key is available
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', '').strip('"')
    
    def setup_ui(self):
        """Setup the batch publisher user interface"""
        # Main frame with scrollbar
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
        title_label = ttk.Label(main_frame, text="Batch Wallpaper Publisher", font=("Arial", 20, "bold"))
        title_label.pack(pady=(0, 5))
        
        subtitle_label = ttk.Label(main_frame, text="Process Entire Folders with One Click - WebP Conversion & AI Metadata", font=("Arial", 11))
        subtitle_label.pack(pady=(0, 15))
        
        # Features info
        info_frame = ttk.Frame(main_frame)
        info_frame.pack(fill=tk.X, pady=(0, 20))
        
        ttk.Label(info_frame, text="🚀 Process entire folders automatically", font=("Arial", 10), foreground="blue").pack(anchor=tk.W)
        ttk.Label(info_frame, text="🤖 AI-powered metadata generation for each image", font=("Arial", 10), foreground="green").pack(anchor=tk.W)
        ttk.Label(info_frame, text="📱 WebP conversion for optimal web performance", font=("Arial", 10), foreground="orange").pack(anchor=tk.W)
        ttk.Label(info_frame, text="📊 Automatic analytics setup and progress tracking", font=("Arial", 10), foreground="purple").pack(anchor=tk.W)
        ttk.Label(info_frame, text="⚡ Smart error handling and resume functionality", font=("Arial", 10), foreground="darkgreen").pack(anchor=tk.W)
        
        # Folder selection frame
        folder_frame = ttk.LabelFrame(main_frame, text="Folder Selection", padding=15)
        folder_frame.pack(fill=tk.X, pady=(0, 15))
        
        folder_selection_frame = ttk.Frame(folder_frame)
        folder_selection_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(folder_selection_frame, text="📁 Select Folder", command=self.select_folder).pack(side=tk.LEFT)
        self.folder_path_label = ttk.Label(folder_selection_frame, text="No folder selected", foreground="gray")
        self.folder_path_label.pack(side=tk.LEFT, padx=(15, 0))
        
        # Image count and preview
        self.image_count_label = ttk.Label(folder_frame, text="", foreground="blue")
        self.image_count_label.pack(anchor=tk.W, pady=(5, 0))
        
        # AI Configuration frame
        ai_frame = ttk.LabelFrame(main_frame, text="AI Configuration", padding=15)
        ai_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Gemini API key
        api_frame = ttk.Frame(ai_frame)
        api_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(api_frame, text="Gemini API Key:").pack(side=tk.LEFT)
        self.gemini_key_entry = ttk.Entry(api_frame, width=40, show="*")
        self.gemini_key_entry.pack(side=tk.LEFT, padx=(10, 15))
        
        # Pre-populate if available
        if hasattr(self, 'gemini_api_key') and self.gemini_api_key:
            self.gemini_key_entry.insert(0, self.gemini_api_key)
        
        # Auto-generate metadata checkbox
        self.auto_generate_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(api_frame, text="Auto-generate metadata with AI", 
                       variable=self.auto_generate_var).pack(side=tk.LEFT)
        
        # Default category for batch processing
        category_frame = ttk.Frame(ai_frame)
        category_frame.pack(fill=tk.X, pady=(5, 0))
        
        ttk.Label(category_frame, text="Default Category:").pack(side=tk.LEFT)
        self.default_category_var = tk.StringVar()
        self.default_category_combo = ttk.Combobox(category_frame, textvariable=self.default_category_var, 
                                                 values=self.website_categories, width=20)
        self.default_category_combo.pack(side=tk.LEFT, padx=(10, 15))
        self.default_category_combo.set("abstract")  # Default value
        
        # Processing options frame
        options_frame = ttk.LabelFrame(main_frame, text="Processing Options", padding=15)
        options_frame.pack(fill=tk.X, pady=(0, 15))
        
        options_left = ttk.Frame(options_frame)
        options_left.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        options_right = ttk.Frame(options_frame)
        options_right.pack(side=tk.RIGHT, fill=tk.X, expand=True)
        
        # Processing options
        self.skip_existing_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(options_left, text="Skip files that fail validation", 
                       variable=self.skip_existing_var).pack(anchor=tk.W)
        
        self.delay_between_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(options_left, text="Add 2-second delay between uploads", 
                       variable=self.delay_between_var).pack(anchor=tk.W)
        
        # Progress tracking frame
        progress_frame = ttk.LabelFrame(main_frame, text="Processing Progress", padding=15)
        progress_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Progress bar
        self.progress_bar = ttk.Progressbar(progress_frame, mode='determinate')
        self.progress_bar.pack(fill=tk.X, pady=(0, 8))
        
        # Status labels
        status_info_frame = ttk.Frame(progress_frame)
        status_info_frame.pack(fill=tk.X, pady=(0, 8))
        
        self.current_file_label = ttk.Label(status_info_frame, text="Ready to process", foreground="blue")
        self.current_file_label.pack(anchor=tk.W)
        
        self.progress_label = ttk.Label(status_info_frame, text="", foreground="gray")
        self.progress_label.pack(anchor=tk.W)
        
        # Results area
        results_frame = ttk.LabelFrame(main_frame, text="Processing Results", padding=15)
        results_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        self.results_text = scrolledtext.ScrolledText(results_frame, height=12, wrap=tk.WORD)
        self.results_text.pack(fill=tk.BOTH, expand=True)
        
        # Control buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X)
        
        self.start_btn = ttk.Button(button_frame, text="🚀 Start Batch Processing", 
                                  command=self.start_batch_processing, state=tk.DISABLED)
        self.start_btn.pack(side=tk.RIGHT, padx=(15, 0))
        
        self.stop_btn = ttk.Button(button_frame, text="⏹ Stop Processing", 
                                 command=self.stop_batch_processing, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.RIGHT, padx=(15, 0))
        
        ttk.Button(button_frame, text="📄 Export Results", command=self.export_results).pack(side=tk.RIGHT, padx=(15, 0))
        ttk.Button(button_frame, text="🧹 Clear Results", command=self.clear_results).pack(side=tk.RIGHT)
    
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
            
            self.log_result("✅ Services initialized successfully", "green")
            
        except Exception as e:
            self.log_result(f"❌ Failed to initialize services: {str(e)}", "red")
            messagebox.showerror("Initialization Error", f"Failed to initialize services: {str(e)}")
    
    def select_folder(self):
        """Open dialog to select folder containing images"""
        folder_path = filedialog.askdirectory(
            title="Select Folder Containing Wallpaper Images"
        )
        
        if folder_path:
            self.selected_folder = folder_path
            self.folder_path_label.config(text=os.path.basename(folder_path), foreground="black")
            
            # Scan for image files
            self.scan_folder_for_images()
            self.check_ready_state()
    
    def scan_folder_for_images(self):
        """Scan selected folder for supported image files"""
        if not self.selected_folder:
            return
        
        supported_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp', '.heic', '.heif'}
        self.image_files = []
        
        folder_path = Path(self.selected_folder)
        
        # Recursively find all image files
        for ext in supported_extensions:
            self.image_files.extend(folder_path.rglob(f'*{ext}'))
            self.image_files.extend(folder_path.rglob(f'*{ext.upper()}'))
        
        # Remove duplicates and sort
        self.image_files = list(set(self.image_files))
        self.image_files.sort()
        
        # Validate images
        valid_images = []
        for image_path in self.image_files:
            is_valid, _ = self.image_processor.validate_image(str(image_path))
            if is_valid:
                valid_images.append(image_path)
        
        self.image_files = valid_images
        
        # Update UI
        count_text = f"Found {len(self.image_files)} valid images"
        if len(self.image_files) > 0:
            count_text += f" • First: {self.image_files[0].name}"
        
        self.image_count_label.config(text=count_text, foreground="green" if len(self.image_files) > 0 else "red")
        
        self.log_result(f"📁 Scanned folder: {self.selected_folder}")
        self.log_result(f"🖼️ Found {len(self.image_files)} valid images for processing")
        
        if len(self.image_files) == 0:
            self.log_result("⚠️ No valid images found in the selected folder", "orange")
    
    def check_ready_state(self):
        """Check if ready to start batch processing"""
        api_key = self.gemini_key_entry.get().strip()
        
        if (self.image_files and 
            len(self.image_files) > 0 and 
            (not self.auto_generate_var.get() or api_key) and
            not self.is_processing):
            self.start_btn.config(state=tk.NORMAL)
        else:
            self.start_btn.config(state=tk.DISABLED)
    
    def start_batch_processing(self):
        """Start the batch processing in a separate thread"""
        if not self.image_files:
            messagebox.showerror("Error", "No images to process")
            return
        
        api_key = self.gemini_key_entry.get().strip()
        if self.auto_generate_var.get() and not api_key:
            messagebox.showerror("Error", "Please enter Gemini API key for AI metadata generation")
            return
        
        # Confirm before starting
        result = messagebox.askyesno(
            "Start Batch Processing", 
            f"Process {len(self.image_files)} images?\n\n"
            f"Features enabled:\n"
            f"• WebP conversion for web display\n"
            f"• {'AI metadata generation' if self.auto_generate_var.get() else 'Manual metadata (using default category)'}\n"
            f"• Automatic upload to R2 and Supabase\n"
            f"• {'2-second delays between uploads' if self.delay_between_var.get() else 'No delays'}\n\n"
            f"This process may take several minutes."
        )
        
        if not result:
            return
        
        # Reset state
        self.processing_results = []
        self.current_processing_index = 0
        self.is_processing = True
        self.stop_processing = False
        
        # Update UI
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.progress_bar.config(maximum=len(self.image_files))
        self.progress_bar['value'] = 0
        
        # Start processing thread
        threading.Thread(target=self._batch_processing_thread, args=(api_key,), daemon=True).start()
    
    def stop_batch_processing(self):
        """Stop the batch processing"""
        self.stop_processing = True
        self.log_result("🛑 Stopping batch processing...", "orange")
    
    def _batch_processing_thread(self, api_key: str):
        """Main batch processing thread"""
        try:
            # Configure AI if needed
            if self.auto_generate_var.get() and api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
            
            total_images = len(self.image_files)
            successful_uploads = 0
            failed_uploads = 0
            
            self.root.after(0, lambda: self.log_result(f"🚀 Starting batch processing of {total_images} images...", "blue"))
            
            for i, image_path in enumerate(self.image_files):
                if self.stop_processing:
                    self.root.after(0, lambda: self.log_result("🛑 Processing stopped by user", "orange"))
                    break
                
                self.current_processing_index = i
                
                # Update progress
                self.root.after(0, lambda idx=i, path=image_path: self._update_progress(idx, path))
                
                try:
                    # Process single image
                    result = self._process_single_image(image_path, model if (self.auto_generate_var.get() and api_key) else None)
                    
                    if result['success']:
                        successful_uploads += 1
                        self.root.after(0, lambda r=result: self.log_result(f"✅ {r['filename']}: Published successfully (ID: {r['wallpaper_id']})", "green"))
                    else:
                        failed_uploads += 1
                        self.root.after(0, lambda r=result: self.log_result(f"❌ {r['filename']}: {r['error']}", "red"))
                    
                    self.processing_results.append(result)
                    
                    # Add delay if configured
                    if self.delay_between_var.get() and i < total_images - 1:
                        time.sleep(2)
                        
                except Exception as e:
                    failed_uploads += 1
                    error_result = {
                        'success': False,
                        'filename': image_path.name,
                        'error': str(e),
                        'image_path': str(image_path)
                    }
                    self.processing_results.append(error_result)
                    self.root.after(0, lambda err=str(e), name=image_path.name: self.log_result(f"❌ {name}: {err}", "red"))
            
            # Processing complete
            self.root.after(0, lambda: self._batch_processing_complete(successful_uploads, failed_uploads, total_images))
            
        except Exception as e:
            self.root.after(0, lambda err=str(e): self.log_result(f"❌ Batch processing failed: {err}", "red"))
        finally:
            self.root.after(0, self._reset_processing_state)
    
    def _process_single_image(self, image_path: Path, ai_model=None) -> Dict:
        """Process a single image with all steps"""
        try:
            filename = image_path.name
            
            # Step 1: Process image (generate all resolutions)
            wallpaper_metadata = {
                'title': image_path.stem.replace('_', ' ').replace('-', ' ').title(),
                'description': f"High-quality mobile wallpaper",
                'category': self.default_category_var.get() or 'abstract',
                'tags': ['wallpaper', 'mobile', 'hd']
            }
            
            # Generate AI metadata if configured
            if ai_model and self.auto_generate_var.get():
                try:
                    ai_metadata = self._generate_ai_metadata(image_path, ai_model)
                    if ai_metadata:
                        wallpaper_metadata.update(ai_metadata)
                except Exception as e:
                    # Continue with default metadata if AI fails
                    pass
            
            # Process all resolutions
            processing_result = self.image_processor.process_all_resolutions(str(image_path), wallpaper_metadata)
            
            if not processing_result['success']:
                return {
                    'success': False,
                    'filename': filename,
                    'error': f"Image processing failed: {processing_result.get('error', 'Unknown error')}",
                    'image_path': str(image_path)
                }
            
            # Step 2: Upload to R2
            bucket_name = os.getenv('R2_BUCKET_NAME')
            uploaded_urls = {}
            
            for resolution in ['thumbnail', 'medium', 'large', 'original']:
                if resolution in processing_result['processed_files']:
                    file_path = processing_result['processed_files'][resolution]
                    upload_filename = Path(file_path).name
                    
                    # Determine content type
                    file_extension = Path(upload_filename).suffix.lower()
                    if file_extension == '.webp':
                        content_type = 'image/webp'
                    elif file_extension == '.png':
                        content_type = 'image/png'
                    else:
                        content_type = 'image/jpeg'
                    
                    # Upload to R2
                    with open(file_path, 'rb') as file:
                        self.r2_client.upload_fileobj(
                            file,
                            bucket_name,
                            upload_filename,
                            ExtraArgs={'ContentType': content_type}
                        )
                    
                    # Store URL
                    public_url = f"{os.getenv('R2_PUBLIC_URL')}/{upload_filename}"
                    uploaded_urls[f"{resolution}_url"] = public_url
            
            # Step 3: Save to Supabase
            wallpaper_data = {
                'title': wallpaper_metadata['title'],
                'description': wallpaper_metadata['description'],
                'category': wallpaper_metadata['category'],
                'tags': wallpaper_metadata.get('tags', []),
                'image_url': uploaded_urls['medium_url'],
                'thumbnail_url': uploaded_urls.get('thumbnail_url'),
                'medium_url': uploaded_urls.get('medium_url'),
                'large_url': uploaded_urls.get('large_url'),
                'original_url': uploaded_urls.get('original_url')
            }
            
            # Insert into Supabase
            result = self.supabase_client.table('wallpapers').insert(wallpaper_data).execute()
            
            if result.data:
                wallpaper_id = result.data[0].get('id')
                
                # Create stats entry
                stats_data = {
                    'wallpaper_id': wallpaper_id,
                    'views': 0,
                    'likes': 0,
                    'downloads': 0
                }
                self.supabase_client.table('wallpaper_stats').insert(stats_data).execute()
                
                # Clean up processed files
                for file_path in processing_result['processed_files'].values():
                    try:
                        Path(file_path).unlink()
                    except:
                        pass
                
                return {
                    'success': True,
                    'filename': filename,
                    'wallpaper_id': wallpaper_id,
                    'uploaded_urls': uploaded_urls,
                    'metadata': wallpaper_metadata,
                    'image_path': str(image_path)
                }
            else:
                return {
                    'success': False,
                    'filename': filename,
                    'error': "Failed to save to database",
                    'image_path': str(image_path)
                }
                
        except Exception as e:
            return {
                'success': False,
                'filename': image_path.name,
                'error': str(e),
                'image_path': str(image_path)
            }
    
    def _generate_ai_metadata(self, image_path: Path, model) -> Optional[Dict]:
        """Generate AI metadata for a single image"""
        try:
            image = Image.open(image_path)
            category_list = ", ".join(self.website_categories)
            
            prompt = f"""
            Analyze this wallpaper image and generate metadata for a mobile wallpaper website.
            
            Provide response in JSON format:
            {{
                "title": "SEO-optimized title (max 60 characters)",
                "description": "Description (max 160 characters)", 
                "category": "one of: {category_list}",
                "tags": ["tag1", "tag2", "tag3", "tag4"]
            }}
            
            Guidelines:
            - Title should be catchy and SEO-friendly
            - Choose the most appropriate category
            - Provide 3-4 relevant tags
            - Consider mobile wallpaper appeal
            """
            
            response = model.generate_content([prompt, image])
            response_text = response.text.strip()
            
            # Clean JSON response
            if response_text.startswith('```json'):
                response_text = response_text[7:-3]
            elif response_text.startswith('```'):
                response_text = response_text[3:-3]
            
            metadata = json.loads(response_text)
            return metadata
            
        except Exception as e:
            return None
    
    def _update_progress(self, index: int, current_path: Path):
        """Update progress UI"""
        self.progress_bar['value'] = index + 1
        self.current_file_label.config(text=f"Processing: {current_path.name}")
        self.progress_label.config(text=f"Progress: {index + 1}/{len(self.image_files)} ({((index + 1)/len(self.image_files)*100):.1f}%)")
    
    def _batch_processing_complete(self, successful: int, failed: int, total: int):
        """Handle batch processing completion"""
        self.log_result(f"🎉 Batch processing complete!", "green")
        self.log_result(f"📊 Results: {successful} successful, {failed} failed out of {total} total", "blue")
        
        if successful > 0:
            self.log_result(f"✅ {successful} wallpapers are now live on your website!", "green")
        
        if failed > 0:
            self.log_result(f"⚠️ {failed} images failed to process - check individual errors above", "orange")
        
        # Show completion dialog
        messagebox.showinfo(
            "Batch Processing Complete",
            f"Processing finished!\n\n"
            f"✅ Successful: {successful}\n"
            f"❌ Failed: {failed}\n"
            f"📊 Total: {total}\n\n"
            f"All successful wallpapers are now live with WebP optimization!"
        )
    
    def _reset_processing_state(self):
        """Reset the processing state"""
        self.is_processing = False
        self.stop_processing = False
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.current_file_label.config(text="Processing complete")
        self.check_ready_state()
    
    def log_result(self, message: str, color: str = "black"):
        """Log a result message to the results area"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        self.results_text.insert(tk.END, log_entry)
        self.results_text.see(tk.END)
        self.root.update_idletasks()
    
    def clear_results(self):
        """Clear the results area"""
        self.results_text.delete(1.0, tk.END)
        self.processing_results = []
    
    def export_results(self):
        """Export processing results to JSON file"""
        if not self.processing_results:
            messagebox.showwarning("No Results", "No results to export")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="Export Results",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                export_data = {
                    'export_timestamp': datetime.now().isoformat(),
                    'total_processed': len(self.processing_results),
                    'successful': len([r for r in self.processing_results if r['success']]),
                    'failed': len([r for r in self.processing_results if not r['success']]),
                    'results': self.processing_results
                }
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                
                messagebox.showinfo("Export Complete", f"Results exported to: {file_path}")
                
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export results: {str(e)}")
    
    def run(self):
        """Start the application"""
        self.root.mainloop()


if __name__ == "__main__":
    app = BatchWallpaperPublisher()
    app.run()