#!/usr/bin/env python3
"""
Wallpaper Publisher - A Tkinter application for uploading and managing wallpapers
Integrates with Supabase database and Cloudflare R2 storage
Uses Google Gemini AI for automatic metadata generation
Generates SEO-friendly slugs matching the website's URL structure
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
    print("Please install requirements: pip install -r wallpaper_publisher_requirements.txt")
    sys.exit(1)

class WallpaperPublisher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Wallpaper Publisher")
        self.root.geometry("900x700")
        self.root.resizable(True, True)
        
        # Load environment variables
        self.load_environment()
        
        # Initialize clients
        self.supabase_client = None
        self.r2_client = None
        self.gemini_model = None
        
        # Application state
        self.selected_image_path = None
        self.preview_image = None
        self.generated_metadata = {}
        
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
        """Setup the user interface"""
        # Create main frame with scrollbar
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(main_frame, text="Wallpaper Publisher", font=("Arial", 16, "bold"))
        title_label.pack(pady=(0, 10))
        
        # Info label about SEO-friendly URLs
        info_label = ttk.Label(main_frame, text="🔗 Publishes wallpapers with SEO-friendly URLs (e.g., /wallpaper/category-title-id)", 
                              font=("Arial", 9), foreground="gray")
        info_label.pack(pady=(0, 20))
        
        # Image selection frame
        image_frame = ttk.LabelFrame(main_frame, text="Image Selection", padding=10)
        image_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(image_frame, text="Select Wallpaper Image", command=self.select_image).pack(side=tk.LEFT)
        self.image_path_label = ttk.Label(image_frame, text="No image selected", foreground="gray")
        self.image_path_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # Image preview frame
        self.preview_frame = ttk.LabelFrame(main_frame, text="Preview", padding=10)
        self.preview_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.preview_label = ttk.Label(self.preview_frame, text="No image selected")
        self.preview_label.pack()
        
        # AI Generation frame
        ai_frame = ttk.LabelFrame(main_frame, text="AI Metadata Generation", padding=10)
        ai_frame.pack(fill=tk.X, pady=(0, 10))
        
        ai_button_frame = ttk.Frame(ai_frame)
        ai_button_frame.pack(fill=tk.X)
        
        self.generate_btn = ttk.Button(ai_button_frame, text="Generate Metadata with AI", 
                                     command=self.generate_metadata, state=tk.DISABLED)
        self.generate_btn.pack(side=tk.LEFT)
        
        # Gemini API key entry
        ttk.Label(ai_button_frame, text="Gemini API Key:").pack(side=tk.LEFT, padx=(20, 5))
        self.gemini_key_entry = ttk.Entry(ai_button_frame, width=30, show="*")
        self.gemini_key_entry.pack(side=tk.LEFT, padx=(0, 10))
        self.gemini_key_entry.bind('<KeyRelease>', self.on_api_key_change)

        # Pre-populate Gemini API key if available in environment
        if hasattr(self, 'gemini_api_key') and self.gemini_api_key:
            self.gemini_key_entry.insert(0, self.gemini_api_key)
        
        # Metadata editing frame
        metadata_frame = ttk.LabelFrame(main_frame, text="Wallpaper Metadata", padding=10)
        metadata_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Create two columns for metadata fields
        left_column = ttk.Frame(metadata_frame)
        left_column.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        right_column = ttk.Frame(metadata_frame)
        right_column.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Title field
        ttk.Label(left_column, text="Title:").pack(anchor=tk.W)
        self.title_entry = ttk.Entry(left_column, width=40)
        self.title_entry.pack(fill=tk.X, pady=(0, 5))
        self.title_entry.bind('<KeyRelease>', self.update_slug_preview)
        
        # Slug preview label
        self.slug_preview_label = ttk.Label(left_column, text="Slug preview will appear here", 
                                          font=("Arial", 8), foreground="gray")
        self.slug_preview_label.pack(anchor=tk.W, pady=(0, 10))
        
        # Category field
        ttk.Label(left_column, text="Category:").pack(anchor=tk.W)
        self.category_var = tk.StringVar()
        self.category_combo = ttk.Combobox(left_column, textvariable=self.category_var, 
                                         values=["nature", "minimal", "abstract", "urban", "space", "art"])
        self.category_combo.pack(fill=tk.X, pady=(0, 10))
        self.category_combo.bind('<<ComboboxSelected>>', self.update_slug_preview)
        
        # Tags field
        ttk.Label(right_column, text="Tags (comma-separated):").pack(anchor=tk.W)
        self.tags_entry = ttk.Entry(right_column, width=40)
        self.tags_entry.pack(fill=tk.X, pady=(0, 10))
        
        # Description field
        ttk.Label(right_column, text="Description:").pack(anchor=tk.W)
        self.description_text = scrolledtext.ScrolledText(right_column, height=4, width=40)
        self.description_text.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Progress and status frame
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.progress_bar = ttk.Progressbar(status_frame, mode='indeterminate')
        self.progress_bar.pack(fill=tk.X, pady=(0, 5))
        
        self.status_label = ttk.Label(status_frame, text="Ready", foreground="green")
        self.status_label.pack()
        
        # Action buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X)
        
        self.publish_btn = ttk.Button(button_frame, text="Publish Wallpaper", 
                                    command=self.publish_wallpaper, state=tk.DISABLED)
        self.publish_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        ttk.Button(button_frame, text="Clear All", command=self.clear_all).pack(side=tk.RIGHT)
    
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
        api_key = self.gemini_key_entry.get().strip()
        if api_key and self.selected_image_path:
            self.generate_btn.config(state=tk.NORMAL)
        else:
            self.generate_btn.config(state=tk.DISABLED)
    
    def select_image(self):
        """Open file dialog to select an image"""
        file_types = [
            ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff"),
            ("JPEG files", "*.jpg *.jpeg"),
            ("PNG files", "*.png"),
            ("All files", "*.*")
        ]
        
        file_path = filedialog.askopenfilename(
            title="Select Wallpaper Image",
            filetypes=file_types
        )
        
        if file_path:
            self.selected_image_path = file_path
            self.image_path_label.config(text=os.path.basename(file_path), foreground="black")
            self.show_preview()
            self.check_ready_state()
    
    def show_preview(self):
        """Display image preview"""
        if not self.selected_image_path:
            return
        
        try:
            # Open and resize image for preview
            image = Image.open(self.selected_image_path)
            
            # Calculate preview size (max 300x200)
            max_width, max_height = 300, 200
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Convert to PhotoImage
            self.preview_image = ImageTk.PhotoImage(image)
            self.preview_label.config(image=self.preview_image, text="")
            
        except Exception as e:
            self.preview_label.config(image="", text=f"Preview error: {str(e)}")
            messagebox.showerror("Preview Error", f"Could not preview image: {str(e)}")
    
    def update_slug_preview(self, event=None):
        """Update the slug preview as user types"""
        title = self.title_entry.get().strip()
        category = self.category_var.get().strip()
        
        if title and category:
            # Clean title for slug preview
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
        """Check if all requirements are met for publishing"""
        api_key = self.gemini_key_entry.get().strip()
        
        if api_key and self.selected_image_path:
            self.generate_btn.config(state=tk.NORMAL)
        else:
            self.generate_btn.config(state=tk.DISABLED)
        
        # Check if ready to publish
        if (self.selected_image_path and 
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
            
            # Configure Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Prepare the image
            image = Image.open(self.selected_image_path)
            
            # Create prompt for metadata generation
            prompt = """
            Analyze this wallpaper image and generate metadata for a wallpaper website. 
            Provide your response in JSON format with the following fields:
            
            {
                "title": "SEO-optimized title (max 60 characters)",
                "description": "Detailed description for SEO (max 160 characters)", 
                "category": "one of: nature, minimal, abstract, urban, space, art",
                "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
            }
            
            Make the title catchy and SEO-friendly. Include relevant keywords in the description.
            Choose the most appropriate category. Provide 3-5 relevant tags.
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
            self.update_status("Metadata generated successfully!", "green")
            self.check_ready_state()
            
        except Exception as e:
            self.update_status(f"Error updating metadata: {str(e)}", "red")
    
    def _handle_ai_error(self, error_message: str):
        """Handle AI generation errors"""
        self.update_status(f"AI generation failed: {error_message}", "red")
        messagebox.showerror("AI Error", f"Failed to generate metadata: {error_message}")
    
    def publish_wallpaper(self):
        """Publish wallpaper to R2 and Supabase"""
        if not self.validate_form():
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
        """Publish wallpaper in a separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status("Uploading to R2...", "blue"))
            
            # Generate unique filename
            file_extension = Path(self.selected_image_path).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Upload to R2
            bucket_name = os.getenv('R2_BUCKET_NAME')
            
            with open(self.selected_image_path, 'rb') as file:
                self.r2_client.upload_fileobj(
                    file,
                    bucket_name,
                    unique_filename,
                    ExtraArgs={'ContentType': f'image/{file_extension[1:]}'}
                )
            
            # Construct public URL
            public_url = f"{os.getenv('R2_PUBLIC_URL')}/{unique_filename}"
            
            self.root.after(0, lambda: self.update_status("Saving to database...", "blue"))
            
            # Prepare data for Supabase
            tags = [tag.strip() for tag in self.tags_entry.get().split(',') if tag.strip()]
            
            wallpaper_data = {
                'title': self.title_entry.get().strip(),
                'description': self.description_text.get(1.0, tk.END).strip(),
                'category': self.category_var.get().strip(),
                'tags': tags,
                'image_url': public_url
            }
            
            # Insert into Supabase
            result = self.supabase_client.table('wallpapers').insert(wallpaper_data).execute()
            
            if result.data:
                # Get the inserted record with its ID
                inserted_record = result.data[0]
                wallpaper_id = inserted_record.get('id')
                
                self.root.after(0, lambda: self._publish_success_with_id(public_url, wallpaper_id, wallpaper_data))
            else:
                raise Exception("Failed to insert into database")
                
        except Exception as e:
            self.root.after(0, lambda: self._publish_error(str(e)))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def _publish_success_with_id(self, public_url: str, wallpaper_id: str, wallpaper_data: Dict):
        """Handle successful publishing with wallpaper ID"""
        self.update_status("Wallpaper published successfully!", "green")
        
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
        
        success_message = f"""✅ Wallpaper published successfully!
        
📷 Image URL: {public_url}
🔗 Wallpaper URL: /wallpaper/{slug}
🆔 Wallpaper ID: {wallpaper_id}
        
🎉 Your wallpaper is now live and accessible via SEO-friendly URLs!
        
💡 Tip: The wallpaper will also appear in the '{category}' category page."""
        
        messagebox.showinfo("Success", success_message)
        self.clear_all()
    
    def _publish_success(self, public_url: str):
        """Fallback success handler (should not be used with new system)"""
        self.update_status("Wallpaper published successfully!", "green")
        messagebox.showinfo("Success", f"Wallpaper published successfully!\nURL: {public_url}")
        self.clear_all()
    
    def _publish_error(self, error_message: str):
        """Handle publishing errors"""
        self.update_status(f"Publishing failed: {error_message}", "red")
        messagebox.showerror("Publishing Error", f"Failed to publish wallpaper: {error_message}")
    
    def clear_all(self):
        """Clear all form fields and reset state"""
        self.selected_image_path = None
        self.preview_image = None
        self.generated_metadata = {}
        
        self.image_path_label.config(text="No image selected", foreground="gray")
        self.preview_label.config(image="", text="No image selected")
        
        self.title_entry.delete(0, tk.END)
        self.category_var.set("")
        self.tags_entry.delete(0, tk.END)
        self.description_text.delete(1.0, tk.END)
        
        # Reset slug preview
        self.slug_preview_label.config(text="Slug preview will appear here", foreground="gray")
        
        self.update_status("Ready", "green")
        self.check_ready_state()
    
    def run(self):
        """Start the application"""
        self.root.mainloop()

if __name__ == "__main__":
    app = WallpaperPublisher()
    app.run()
